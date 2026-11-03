package io.github.nbvc213.notes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.commonmark.ext.autolink.AutolinkExtension;
import org.commonmark.ext.footnotes.FootnotesExtension;
import org.commonmark.ext.gfm.strikethrough.StrikethroughExtension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.LoaderOptions;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.Normalizer;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

/** Java runs only at build time. The published output needs no JVM or backend. */
public final class SiteBuilder {
    private final Path root;
    private Path output;
    private final ObjectMapper json = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final Yaml yaml = new Yaml(new SafeConstructor(new LoaderOptions()));
    private final Parser parser;
    private final HtmlRenderer renderer;
    private final TemplateEngine templates;
    private final List<Map<String, Object>> notes = new ArrayList<>();
    private final List<Map<String, Object>> sections = new ArrayList<>();
    private final Map<String, String> oldUrls = new HashMap<>();
    private final Set<String> ids = new HashSet<>();
    private Map<String, Object> site;
    private List<Map<String, Object>> folders;
    private String stylesheet;

    public SiteBuilder(Path root) {
        this.root = root.toAbsolutePath().normalize();
        output = this.root.resolve("dist");
        var extensions = List.of(TablesExtension.create(), StrikethroughExtension.create(), AutolinkExtension.create(), FootnotesExtension.create());
        parser = Parser.builder().extensions(extensions).build();
        renderer = HtmlRenderer.builder().extensions(extensions).build();
        var resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/"); resolver.setSuffix(".html"); resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8"); resolver.setCacheable(false);
        templates = new TemplateEngine(); templates.setTemplateResolver(resolver);
    }

    public static void main(String[] args) throws Exception {
        if (Runtime.version().feature() < 21) throw new IllegalStateException("Java 21 or newer is required");
        new SiteBuilder(Path.of(System.getProperty("notes.root", "."))).build();
    }

    public void build() throws IOException {
        Path tools = root.resolve(".tools"); Files.createDirectories(tools);
        // OS-owned lock is released on exit/crash; no stale PID lock needs manual removal.
        try (var channel = java.nio.channels.FileChannel.open(tools.resolve("site-build.lock"), StandardOpenOption.CREATE, StandardOpenOption.WRITE);
             var lock = channel.lock()) {
            Path published = root.resolve("dist");
            Path staging = Files.createTempDirectory(tools, "site-stage-");
            output = staging;
            try {
                buildContent();
                Set<Path> generated = new HashSet<>();
                try (var paths = Files.walk(staging)) {
                    for (var file : paths.filter(Files::isRegularFile).toList()) {
                        Path relative = staging.relativize(file); generated.add(relative);
                        Path target = published.resolve(relative); Files.createDirectories(target.getParent());
                        Path temp = Files.createTempFile(target.getParent(), ".site-", ".tmp");
                        try {
                            Files.copy(file, temp, StandardCopyOption.REPLACE_EXISTING);
                            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
                        } finally { Files.deleteIfExists(temp); }
                    }
                }
                // Remove obsolete generated pages only after the new content is ready.
                try (var paths = Files.walk(published)) {
                    for (var file : paths.filter(Files::isRegularFile).toList()) {
                        Path relative = published.relativize(file);
                        String name = relative.toString().replace('\\', '/');
                        if (!name.startsWith("assets/") && !name.startsWith("media/")
                                && (name.endsWith(".html") || name.startsWith("data/"))
                                && !generated.contains(relative)) Files.delete(file);
                    }
                }
            } finally {
                output = published;
                try (var paths = Files.walk(staging)) {
                    for (var file : paths.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(file);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void buildContent() throws IOException {
        site = yaml.load(Files.readString(root.resolve("config/site.yml")));
        folders = (List<Map<String, Object>>) site.get("folders");
        Set<String> folderIds = new HashSet<>();
        for (var folder : folders) {
            String id = String.valueOf(folder.get("id"));
            if (!id.matches("[a-z][a-z0-9-]*") || !folderIds.add(id)) throw new IllegalArgumentException("Invalid or duplicate folder: " + id);
        }
        Files.createDirectories(output);
        try (var paths = Files.walk(root.resolve("content"))) {
            for (var path : paths.filter(p -> p.toString().endsWith(".md")).sorted().toList()) readNote(path, folderIds);
        }
        notes.sort(Comparator.comparing((Map<String, Object> n) -> folders.stream().map(f -> f.get("id")).toList().indexOf(n.get("folder")))
                .thenComparingInt(n -> ((Number) n.get("order")).intValue()).thenComparing(n -> (String) n.get("id")));
        for (var note : notes) processContent(note);
        for (var note : notes) {
            List<Map<String, Object>> siblings = notes.stream().filter(n -> n.get("folder").equals(note.get("folder"))).toList();
            int at = siblings.indexOf(note);
            note.put("previous", at > 0 ? compact(siblings.get(at - 1)) : null);
            note.put("next", at + 1 < siblings.size() ? compact(siblings.get(at + 1)) : null);
            note.put("backlinks", notes.stream().filter(n -> !n.get("id").equals(note.get("id")) && ((Set<?>) n.get("links")).contains(note.get("url"))).map(this::compact).toList());
        }
        for (var folder : folders) {
            var contained = notes.stream().filter(n -> n.get("folder").equals(folder.get("id"))).toList();
            folder.put("count", contained.size()); folder.put("notes", contained.stream().map(this::compact).toList());
            folder.put("url", "/folders/" + folder.get("id") + "/");
        }
        var assets = Files.readString(root.resolve("dist/assets/.vite/manifest.json"));
        @SuppressWarnings("unchecked") var manifest = json.readValue(assets, Map.class);
        @SuppressWarnings("unchecked") var entry = (Map<String, Object>) manifest.get("web/main.ts");
        @SuppressWarnings("unchecked") var css = (List<String>) entry.get("css");
        stylesheet = "/assets/" + css.getFirst();
        render("/", "home", "我的知识花园", null, null);
        render("/notes/", "list", "全部笔记", null, null);
        render("/library/", "library", "我的书架", null, null);
        render("/about/", "about", "关于这里", null, null);
        for (var folder : folders) render((String) folder.get("url"), "folder", (String) folder.get("name"), null, folder);
        for (var note : notes) render((String) note.get("url"), "article", (String) note.get("title"), note, null);
        render("/404.html", "notfound", "这页笔记暂时找不到", null, null);
        for (var entryUrl : oldUrls.entrySet()) {
            String path = entryUrl.getKey();
            if (!path.endsWith(".html")) continue;
            String dest = entryUrl.getValue();
            write(path, "<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><title>笔记已迁移</title><link rel=\"canonical\" href=\"" + site.get("url") + dest + "\"><meta name=\"robots\" content=\"noindex\"><p>这篇笔记有了新地址。<a href=\"" + dest + "\">继续阅读</a></p><script>location.replace(" + json.writeValueAsString(dest) + "+location.search+location.hash)</script></html>");
        }
        var catalog = new LinkedHashMap<String, Object>();
        catalog.put("site", site); catalog.put("folders", folders); catalog.put("notes", notes.stream().map(this::compact).toList());
        write("/data/catalog.json", json.writeValueAsString(catalog));
        List<Map<String, Object>> searchParts = new ArrayList<>();
        for (var f : folders) {
            var part = sections.stream().filter(s -> s.get("folder").equals(f.get("id"))).toList();
            String partUrl = "/data/search-" + f.get("id") + ".json";
            write(partUrl, json.writeValueAsString(part));
            searchParts.add(Map.of("folder", f.get("id"), "url", partUrl, "count", part.size()));
        }
        write("/data/search-manifest.json", json.writeValueAsString(searchParts));
        write("/.nojekyll", "");
        write("/robots.txt", "User-agent: *\nAllow: /\nSitemap: " + site.get("url") + "/sitemap.xml\n");
        StringBuilder sitemap = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        for (var note : notes) sitemap.append("<url><loc>").append(site.get("url")).append(note.get("url")).append("</loc><lastmod>").append(note.get("updated")).append("</lastmod></url>");
        write("/sitemap.xml", sitemap.append("</urlset>").toString());
        Path media = root.resolve("public");
        if (Files.isDirectory(media)) try (var paths = Files.walk(media)) {
            for (var p : paths.filter(Files::isRegularFile).toList()) {
                Path to = output.resolve(media.relativize(p)); Files.createDirectories(to.getParent()); Files.copy(p, to, StandardCopyOption.REPLACE_EXISTING);
            }
        }
        System.out.printf("Built %d notes · %d folders · %d search sections · %d legacy redirects%n", notes.size(), folders.size(), sections.size(), oldUrls.size());
    }

    private void readNote(Path path, Set<String> folderIds) throws IOException {
        String text = Files.readString(path).replace("\r\n", "\n");
        if (!text.startsWith("---\n")) throw new IllegalArgumentException("Missing front matter: " + path);
        int end = text.indexOf("\n---", 4);
        if (end < 0) throw new IllegalArgumentException("Unclosed front matter: " + path);
        Map<String, Object> meta = yaml.load(text.substring(4, end));
        if (Boolean.TRUE.equals(meta.get("draft"))) return;
        String id = Objects.toString(meta.get("id"), "");
        if (!id.matches("[a-z][a-z0-9-]*") || !ids.add(id)) throw new IllegalArgumentException("Invalid or duplicate note id: " + id);
        String directoryName = path.getParent().getFileName().toString();
        folders.stream().filter(f -> Objects.equals(f.get("name"), directoryName)).findFirst()
                .ifPresent(f -> meta.put("folder", f.get("id")));
        meta.put("title", path.getFileName().toString().replaceFirst("\\.md$", ""));
        if (!folderIds.contains(meta.get("folder"))) throw new IllegalArgumentException("Unknown folder in " + path);
        meta.putIfAbsent("order", 1000); meta.putIfAbsent("tags", List.of()); meta.putIfAbsent("pinned", false);
        if (!(meta.get("tags") instanceof List<?>)) throw new IllegalArgumentException("Tags must be a list: " + path);
        meta.put("date", date(meta.get("date"))); meta.put("updated", date(meta.getOrDefault("updated", meta.get("date"))));
        meta.put("url", "/read/" + id + "/");
        meta.put("source", root.relativize(path).toString());
        meta.put("markdown", text.substring(end + 4).strip());
        meta.put("folderName", folders.stream().filter(f -> f.get("id").equals(meta.get("folder"))).findFirst().orElseThrow().get("name"));
        for (var url : (List<?>) meta.getOrDefault("legacyUrls", List.of())) {
            String legacy = decode(url.toString());
            if (oldUrls.putIfAbsent(legacy, (String) meta.get("url")) != null) throw new IllegalArgumentException("Duplicate legacy URL: " + legacy);
        }
        notes.add(meta);
    }

    private void processContent(Map<String, Object> note) {
        String md = (String) note.get("markdown");
        // Keep math intact through Markdown's escaping/underscore processing.
        StringBuilder preprocessed = new StringBuilder();
        boolean fenced = false;
        for (String line : md.split("\n", -1)) {
            if (line.matches("^\\s*(`{3,}|~{3,}).*")) fenced = !fenced;
            if (!fenced) {
                line = line.replaceFirst("^((?:> ?)+)\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|EXAMPLE|SUPPLEMENT|CONCLUSION|EXERCISE)]", "$1**$2**");
            }
            preprocessed.append(line).append('\n');
        }
        var protectedMath = protectMath(preprocessed.toString());
        String raw = renderer.render(parser.parse(protectedMath.markdown()));
        for (var entry : protectedMath.expressions().entrySet()) raw = raw.replace(entry.getKey(), escapeHtml(entry.getValue()));
        Safelist safe = Safelist.relaxed().addTags("details", "summary", "kbd", "mark", "span", "div", "sub", "sup", "s", "del")
                .addAttributes(":all", "id", "class", "title").addAttributes("code", "class")
                .addAttributes("img", "width", "height").addAttributes("details", "open", "data-kind")
                .addProtocols("a", "href", "http", "https", "mailto").preserveRelativeLinks(true);
        Document rawDoc = Jsoup.parseBodyFragment(raw);
        for (var element : rawDoc.select("font[color],span[style]")) {
            String color = element.tagName().equals("font") ? element.attr("color") : element.attr("style").replaceFirst("(?i).*?color\\s*:\\s*([^;]+).*", "$1");
            String normalized = color.toLowerCase(Locale.ROOT).strip();
            String tone = switch (normalized) { case "red", "#ff0000", "#f00" -> "red"; case "blue", "#0000ff", "#00f" -> "blue"; case "green", "#008000" -> "green"; default -> ""; };
            element.tagName("span"); if (!tone.isEmpty()) element.addClass("legacy-tone-" + tone);
        }
        Document doc = Jsoup.parseBodyFragment(Jsoup.clean(rawDoc.body().html(), Objects.toString(site.get("url")) + "/", safe));
        doc.outputSettings().prettyPrint(false);
        for (var details : doc.select("details[data-kind]")) if (!Set.of("answer", "example", "extra").contains(details.attr("data-kind"))) details.removeAttr("data-kind");
        repairLegacyStrong(doc);
        Set<String> used = new HashSet<>();
        List<Map<String, Object>> headings = new ArrayList<>();
        for (var heading : doc.select("h1,h2,h3,h4,h5,h6")) {
            String anchor = uniqueSlug(heading.text(), used);
            heading.id(anchor);
            headings.add(Map.of("id", anchor, "title", heading.text(), "level", Integer.parseInt(heading.tagName().substring(1))));
            heading.appendElement("a").addClass("heading-link").attr("href", "#" + anchor).attr("aria-label", "复制本节链接").attr("data-copy-anchor", anchor).text("#");
        }
        for (var img : doc.select("img")) { img.attr("loading", "lazy"); img.attr("decoding", "async"); }
        for (var table : doc.select("table")) table.wrap("<div class=\"table-scroll\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"></div>");
        Set<String> links = new HashSet<>();
        for (var a : doc.select("a[href]")) {
            String href = a.attr("href");
            String local = href.replace(Objects.toString(site.get("url")), "");
            String path = decode(local.split("#", 2)[0]);
            if (oldUrls.containsKey(path)) href = oldUrls.get(path) + (local.contains("#") ? "#" + local.split("#", 2)[1] : "");
            a.attr("href", href);
            if (href.startsWith("/read/")) links.add(href.split("#", 2)[0]);
            if (href.startsWith("https://") || href.startsWith("http://")) a.attr("target", "_blank").attr("rel", "noopener noreferrer");
        }
        enhanceCallouts(doc);
        String plain = doc.body().text();
        note.put("chars", plain.length()); note.put("minutes", Math.max(1, plain.length() / 500));
        String summary = Objects.toString(note.getOrDefault("description", ""));
        if (summary.isBlank()) {
            Element first = doc.select("p").stream().filter(p -> p.parents().stream().noneMatch(e -> e.tagName().equals("blockquote"))).findFirst().orElse(null);
            summary = first == null ? "" : first.text();
            if (summary.length() > 85) summary = summary.substring(0, 85) + "…";
        }
        note.put("description", summary); note.put("headings", headings); note.put("links", links);
        note.put("html", doc.body().html());
        indexSections(note, doc.body());
        note.remove("markdown");
    }

    static void enhanceCallouts(Document doc) {
        for (var block : doc.select("blockquote")) {
            Element labelParagraph = block.children().stream().filter(e -> e.tagName().equals("p")).findFirst().orElse(null);
            String text = labelParagraph == null ? "" : labelParagraph.text();
            String token = text.split("[ ：:]+",2)[0];
            String type = switch (token) {
                case "NOTE", "注意" -> "note";
                case "SUPPLEMENT", "TIP", "补充" -> "supplement";
                case "WARNING", "CAUTION", "警告" -> "warning";
                case "CONCLUSION", "IMPORTANT", "结论" -> "conclusion";
                case "EXERCISE", "练习", "【练习】" -> "exercise";
                case "EXAMPLE", "示例" -> "example";
                default -> "note";
            };
            boolean explicit = Set.of("NOTE","SUPPLEMENT","TIP","WARNING","CAUTION","CONCLUSION","IMPORTANT","EXERCISE","EXAMPLE").contains(token);
            if (explicit && labelParagraph != null) {
                String label = switch(type) {case "supplement" -> "补充";case "warning" -> "警告";case "conclusion" -> "结论";case "exercise" -> "练习";case "example" -> "示例";default -> "注意";};
                Element marker = labelParagraph.select("strong").first();
                if (marker != null) marker.remove();
                String custom = labelParagraph.text().strip();
                labelParagraph.empty().addClass("callout-label");
                String icon = switch(type) {case "supplement" -> "bulb";case "warning" -> "warning";case "conclusion" -> "circle-check";case "exercise" -> "edit";case "example" -> "example";default -> "info";};
                Element svg = labelParagraph.appendElement("svg").addClass("callout-icon")
                        .attr("width", "20").attr("height", "20").attr("viewBox", "0 0 24 24")
                        .attr("fill", "none").attr("stroke", "currentColor").attr("stroke-width", "1.7")
                        .attr("stroke-linecap", "round").attr("stroke-linejoin", "round").attr("aria-hidden", "true");
                svg.appendElement("use").attr("href", "/media/icons.svg#" + icon);
                labelParagraph.appendElement("strong").addClass("callout-kind").text(label);
                if (!custom.isEmpty()) labelParagraph.appendElement("span").addClass("callout-title").text(custom);
            }
            block.addClass("callout").addClass("callout-" + type);
            Element answer = block.children().stream().filter(e -> e.tagName().equals("p") && e.text().equals("【答案】")).findFirst().orElse(null);
            if (answer != null) {
                // Split before the answer, leaving the exercise visible for self-testing.
                if (answer != null) {
                    Element details = new Element("details").addClass("answer-block").attr("data-kind", "answer");
                    details.appendElement("summary").text("查看答案与解析");
                    var siblings = new ArrayList<>(block.children());
                    int at = siblings.indexOf(answer);
                    for (int i = at + 1; i < siblings.size(); i++) details.appendChild(siblings.get(i));
                    answer.remove(); block.appendChild(details);
                }
            }
            String first = labelParagraph == null ? "" : labelParagraph.text();
            String collapsible = (type.equals("supplement") || first.matches("^补充.*?")) ? "extra" : (type.equals("example") || first.matches("^(示例|EXAMPLE).*?")) ? "example" : "";
            if (!collapsible.isEmpty() && answer == null) {
                Element details = new Element("details").addClass("content-details").attr("data-kind", collapsible);
                if (collapsible.equals("example")) details.attr("open", "");
                Element summaryRow = details.appendElement("summary").addClass("content-details-heading");
                Element label = summaryRow.appendElement("span").addClass("content-details-label");
                Element existingLabel = block.children().stream().filter(e -> e.hasClass("callout-label")).findFirst().orElse(null);
                if (existingLabel != null) {
                    for (var child : new ArrayList<>(existingLabel.childNodes())) label.appendChild(child);
                    existingLabel.remove();
                } else {
                    label.appendElement("strong").addClass("callout-kind").text(collapsible.equals("example") ? "示例" : "补充");
                }
                Element toggle = summaryRow.appendElement("span").addClass("content-details-toggle");
                Element arrow = toggle.appendElement("svg").addClass("content-details-arrow")
                        .attr("width", "14").attr("height", "14").attr("viewBox", "0 0 24 24")
                        .attr("fill", "none").attr("stroke", "currentColor").attr("stroke-width", "1.8")
                        .attr("stroke-linecap", "round").attr("stroke-linejoin", "round").attr("aria-hidden", "true");
                arrow.appendElement("path").attr("d", "m9 5 7 7-7 7");
                toggle.appendElement("span").addClass("when-closed").text("展开");
                toggle.appendElement("span").addClass("when-open").text("收起");
                block.before(details); details.appendChild(block);
            }
        }
    }

    static void repairLegacyStrong(Document doc) {
        // CommonMark treats punctuation-adjacent Chinese closing markers literally.
        // Repair remaining pairs in prose text nodes only; never touch code or HTML attributes.
        var pattern = Pattern.compile("\\*\\*(\\S(?:.*?\\S)?)\\*\\*");
        for (var element : new ArrayList<>(doc.getAllElements())) {
            if (element.closest("pre,code,script,style") != null) continue;
            for (var node : new ArrayList<>(element.textNodes())) {
                var matcher = pattern.matcher(node.getWholeText());
                int at = 0; boolean matched = false;
                while (matcher.find()) {
                    matched = true;
                    node.before(new org.jsoup.nodes.TextNode(node.getWholeText().substring(at,matcher.start())));
                    node.before(new Element("strong").text(matcher.group(1)));
                    at = matcher.end();
                }
                if (matched) { node.before(new org.jsoup.nodes.TextNode(node.getWholeText().substring(at))); node.remove(); }
            }
        }
    }

    void indexSections(Map<String, Object> note, Element root) {
        // Follow document order, including headings nested in details and blockquotes.
        // Visit text nodes once so parent containers do not duplicate subsection content.
        class Indexer {
            String id = "";
            String title = (String) note.get("title");
            final StringBuilder body = new StringBuilder();
            void visit(org.jsoup.nodes.Node node) {
                if (node instanceof org.jsoup.nodes.TextNode text) {
                    body.append(text.getWholeText());
                } else if (node instanceof Element element) {
                    if (element.tagName().matches("h[1-6]")) {
                        addSection(note, id, title, body.toString());
                        id = element.id();
                        Element clone = element.clone(); clone.select(".heading-link").remove();
                        title = clone.text(); body.setLength(0);
                        return;
                    }
                    for (var child : element.childNodes()) visit(child);
                    if (element.isBlock() || element.tagName().equals("br")) body.append('\n');
                }
            }
        }
        var indexer = new Indexer(); indexer.visit(root);
        addSection(note, indexer.id, indexer.title, indexer.body.toString());
    }

    private void addSection(Map<String, Object> note, String id, String title, String body) {
        if (body.isBlank()) return;
        sections.add(Map.of("noteId", note.get("id"), "title", note.get("title"), "folder", note.get("folder"), "folderName", note.get("folderName"),
                "section", title, "anchor", id, "url", note.get("url") + (id.isEmpty() ? "" : "#" + id), "body", body, "tags", note.get("tags")));
    }

    private Map<String, Object> compact(Map<String, Object> note) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (String key : List.of("id", "title", "folder", "folderName", "order", "date", "updated", "tags", "pinned", "url", "description", "minutes", "chars")) result.put(key, note.get(key));
        return result;
    }

    private void render(String url, String kind, String title, Map<String, Object> note, Map<String, Object> folder) throws IOException {
        Context context = new Context(Locale.SIMPLIFIED_CHINESE);
        context.setVariable("site", site); context.setVariable("folders", folders); context.setVariable("notes", notes);
        context.setVariable("latest", notes.stream().sorted(Comparator.comparing((Map<String, Object> n) -> (String) n.get("updated")).reversed()).limit(6).toList());
        context.setVariable("pinned", notes.stream().filter(n -> Boolean.TRUE.equals(n.get("pinned"))).limit(3).toList());
        context.setVariable("kind", kind); context.setVariable("title", title); context.setVariable("note", note); context.setVariable("folder", folder);
        context.setVariable("url", url); context.setVariable("stylesheet", stylesheet);
        context.setVariable("pageJson", json.writeValueAsString(Map.of("kind", kind, "noteId", note == null ? "" : note.get("id"), "folderId", folder == null ? "" : folder.get("id"), "title", title)).replace("<", "\\u003c"));
        context.setVariable("tocJson", note == null ? "[]" : json.writeValueAsString(note.get("headings")).replace("<", "\\u003c"));
        write(url, templates.process("page", context));
    }

    private void write(String url, String content) throws IOException {
        Path path = output.resolve(url.substring(1) + (url.endsWith("/") ? "index.html" : "")).normalize();
        if (!path.startsWith(output)) throw new IllegalArgumentException("Output escapes dist: " + url);
        Files.createDirectories(path.getParent());
        Path temp = path.resolveSibling(path.getFileName() + ".tmp");
        Files.writeString(temp, content); Files.move(temp, path, StandardCopyOption.REPLACE_EXISTING);
    }

    static String uniqueSlug(String title, Set<String> used) {
        String slug = Normalizer.normalize(title, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N} _-]", "").replaceAll("[ _]+", "-").replaceAll("^-+|-+$", "");
        if (slug.isBlank()) slug = "section";
        String result = slug; int suffix = 1;
        while (!used.add(result)) result = slug + "-" + suffix++;
        return result;
    }

    record ProtectedMath(String markdown, Map<String, String> expressions) {}

    /** Preserve TeX through Markdown parsing, while leaving fenced/inline code untouched. */
    static ProtectedMath protectMath(String markdown) {
        Map<String, String> expressions = new LinkedHashMap<>();
        StringBuilder result = new StringBuilder();
        int i = 0; char fence = 0; int fenceLength = 0;
        while (i < markdown.length()) {
            boolean lineStart = i == 0 || markdown.charAt(i - 1) == '\n';
            if (lineStart) {
                int end = markdown.indexOf('\n', i); if (end < 0) end = markdown.length();
                String line = markdown.substring(i, end);
                var match = Pattern.compile("^ {0,3}(`{3,}|~{3,})(.*)$").matcher(line);
                if (match.matches()) {
                    String delimiter = match.group(1);
                    if (fence == 0) { fence = delimiter.charAt(0); fenceLength = delimiter.length(); }
                    else if (fence == delimiter.charAt(0) && delimiter.length() >= fenceLength && match.group(2).isBlank()) fence = 0;
                    result.append(line); i = end; if (i < markdown.length()) { result.append('\n'); i++; } continue;
                }
                if (fence != 0) { result.append(line); i = end; if (i < markdown.length()) { result.append('\n'); i++; } continue; }
            }
            char c = markdown.charAt(i);
            if (c == '`') {
                int run = i + 1; while (run < markdown.length() && markdown.charAt(run) == '`') run++;
                String ticks = markdown.substring(i, run); int end = markdown.indexOf(ticks, run);
                if (end >= 0) { result.append(markdown, i, end + ticks.length()); i = end + ticks.length(); continue; }
            }
            String left = null, right = null;
            if (markdown.startsWith("$$", i) && (i == 0 || markdown.charAt(i - 1) != '\\')) { left = "$$"; right = "$$"; }
            else if (c == '$' && (i == 0 || markdown.charAt(i - 1) != '\\')) { left = "$"; right = "$"; }
            else if (markdown.startsWith("\\[", i)) { left = "\\["; right = "\\]"; }
            else if (markdown.startsWith("\\(", i)) { left = "\\("; right = "\\)"; }
            if (left != null) {
                int end = markdown.indexOf(right, i + left.length());
                if (end >= 0 && (!left.equals("$") || !markdown.substring(i, end).contains("\n"))) {
                    String token = "ZZNOTEMATH" + expressions.size() + "TOKENZZ";
                    expressions.put(token, markdown.substring(i, end + right.length())); result.append(token); i = end + right.length(); continue;
                }
            }
            result.append(c); i++;
        }
        return new ProtectedMath(result.toString(), expressions);
    }

    private static String escapeHtml(String text) { return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }

    private static String date(Object value) {
        if (value instanceof Date d) return d.toInstant().atZone(ZoneId.of("UTC")).toLocalDate().toString();
        String s = Objects.toString(value, "");
        if (!s.matches("\\d{4}-\\d{2}-\\d{2}")) throw new IllegalArgumentException("Expected YYYY-MM-DD, got " + s);
        return java.time.LocalDate.parse(s).toString();
    }

    private static String decode(String path) {
        try { return URLDecoder.decode(path.replace("+", "%2B"), StandardCharsets.UTF_8); }
        catch (IllegalArgumentException e) { return path; }
    }
}
