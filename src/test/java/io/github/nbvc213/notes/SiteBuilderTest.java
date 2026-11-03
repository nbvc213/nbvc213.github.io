package io.github.nbvc213.notes;

import org.junit.jupiter.api.Test;
import java.util.HashSet;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import java.nio.file.Files;
import static org.junit.jupiter.api.Assertions.*;

class SiteBuilderTest {
    @Test void repairsChinesePunctuationBoldWithoutChangingCode() {
        var doc = org.jsoup.Jsoup.parseBodyFragment("<p>**数组长度不能改变。**创建数组。</p><pre><code>**原样保留。**</code></pre>");
        SiteBuilder.repairLegacyStrong(doc);
        assertEquals("数组长度不能改变。", doc.selectFirst("strong").text());
        assertEquals("**原样保留。**", doc.selectFirst("code").text());
    }
    @Test void chapterAnchorsPreserveChineseAndDisambiguateDuplicates() {
        var used = new HashSet<String>();
        assertEquals("编译阶段", SiteBuilder.uniqueSlug("编译阶段", used));
        assertEquals("编译阶段-1", SiteBuilder.uniqueSlug("编译阶段", used));
        assertEquals("jdkjrejvm", SiteBuilder.uniqueSlug("JDK、JRE、JVM", used));
        assertEquals("section", SiteBuilder.uniqueSlug("!!!", used));
        assertEquals("section-1", SiteBuilder.uniqueSlug("!!!", used));
    }

    @Test void preservesTexButDoesNotTreatCodeAsEquations() {
        String source = "公式 $a_b < c$，以及 \\(x_1\\)。\n\n```java\nString x = \"$not_math$\";\n```\n\n`$code$`\n\n$$\n\\frac{a_1}{b_2}\n$$";
        var protectedMath = SiteBuilder.protectMath(source);
        assertEquals(3, protectedMath.expressions().size());
        assertTrue(protectedMath.markdown().contains("String x = \"$not_math$\""));
        assertTrue(protectedMath.markdown().contains("`$code$`"));
        assertTrue(protectedMath.expressions().containsValue("$a_b < c$"));
    }

    @Test void staticOutputExcludesDraftsSanitizesHtmlAndKeepsChapterSearch(@TempDir Path directory) throws Exception {
        Files.createDirectories(directory.resolve("config")); Files.createDirectories(directory.resolve("content/Java"));
        Files.createDirectories(directory.resolve("dist/assets/.vite"));
        Files.writeString(directory.resolve("config/site.yml"), "title: Test\nurl: https://example.test\ndescription: Test\nfolders:\n  - id: java\n    name: Java\n    eyebrow: JAVA\n    description: Test\n    color: green\n");
        Files.writeString(directory.resolve("dist/assets/.vite/manifest.json"), "{\"web/main.ts\":{\"css\":[\"app.css\"]}}");
        Files.writeString(directory.resolve("content/Java/文件名即标题.md"), "---\nid: java-01\ndate: 2026-01-01\nlegacyUrls: [/old.html]\n---\n\n## 环境变量 `CLASSPATH`\n\n正文 $a_b < c$。\n\n[站内链接](/read/java-01/#环境变量-classpath)\n\n<script>alert('x')</script>\n\n<img src=\"x.png\" onerror=\"alert(1)\">\n");
        Files.writeString(directory.resolve("content/draft.md"), "---\nid: draft\ntitle: PRIVATE_DRAFT_SENTINEL\nfolder: java\ndate: 2026-01-01\ndraft: true\n---\nPRIVATE_DRAFT_SENTINEL");
        new SiteBuilder(directory).build();
        String html = Files.readString(directory.resolve("dist/read/java-01/index.html"));
        assertTrue(html.contains("文件名即标题"));
        String search = Files.readString(directory.resolve("dist/data/search-java.json"));
        assertTrue(html.contains("href=\"/read/java-01/#环境变量-classpath\""));
        assertFalse(html.contains("alert(")); assertFalse(html.contains("onerror="));
        assertTrue(html.contains("$a_b &lt; c$"));
        assertTrue(search.contains("环境变量 CLASSPATH"));
        assertFalse(search.contains("PRIVATE_DRAFT_SENTINEL"));
        assertFalse(Files.readString(directory.resolve("dist/data/catalog.json")).contains("PRIVATE_DRAFT_SENTINEL"));
        assertTrue(Files.readString(directory.resolve("dist/old.html")).contains("location.hash"));
        // A malformed saved note must not erase the last readable website.
        String previousCatalog = Files.readString(directory.resolve("dist/data/catalog.json"));
        Files.writeString(directory.resolve("content/broken.md"), "missing front matter");
        assertThrows(IllegalArgumentException.class, () -> new SiteBuilder(directory).build());
        assertEquals(html, Files.readString(directory.resolve("dist/read/java-01/index.html")));
        assertEquals(previousCatalog, Files.readString(directory.resolve("dist/data/catalog.json")));
        Files.delete(directory.resolve("content/broken.md"));
        Files.delete(directory.resolve("content/Java/文件名即标题.md"));
        new SiteBuilder(directory).build();
        assertFalse(Files.exists(directory.resolve("dist/read/java-01/index.html")));
        assertFalse(Files.exists(directory.resolve("dist/old.html")));

    }
    @Test void indexesHeadingsInsideNestedDetailsWithoutDuplicatingBodies(@TempDir Path directory) throws Exception {
        Files.createDirectories(directory.resolve("config"));
        Files.createDirectories(directory.resolve("content"));
        Files.createDirectories(directory.resolve("dist/assets/.vite"));
        Files.writeString(directory.resolve("config/site.yml"), """
                title: Test
                url: https://example.test
                description: Test
                folders:
                  - id: java
                    name: Java
                """);
        Files.writeString(directory.resolve("dist/assets/.vite/manifest.json"), "{\"web/main.ts\":{\"css\":[\"app.css\"]}}");
        Files.writeString(directory.resolve("content/note.md"), """
                ---
                id: nested
                title: Nested
                folder: java
                date: 2026-01-01
                ---
                ## Outer

                OUTER_SENTINEL

                <details>
                <summary>First level</summary>
                <details>
                <summary>Second level</summary>

                ### Inner `code`

                INNER_SENTINEL with **bold** and `inline`.

                - first list item
                - second list item

                </details>
                </details>

                ## Following

                FOLLOWING_SENTINEL
                """);
        new SiteBuilder(directory).build();
        var data = new com.fasterxml.jackson.databind.ObjectMapper().readTree(
                Files.readString(directory.resolve("dist/data/search-java.json")));
        var byAnchor = new java.util.HashMap<String, com.fasterxml.jackson.databind.JsonNode>();
        data.forEach(section -> byAnchor.put(section.get("anchor").asText(), section));
        assertTrue(byAnchor.containsKey("inner-code"));
        assertEquals("Inner code", byAnchor.get("inner-code").get("section").asText());
        assertTrue(byAnchor.get("inner-code").get("body").asText().contains("INNER_SENTINEL"));
        assertTrue(byAnchor.get("inner-code").get("body").asText().contains("second list item"));
        assertFalse(byAnchor.get("outer").get("body").asText().contains("INNER_SENTINEL"));
        assertFalse(byAnchor.get("inner-code").get("body").asText().contains("FOLLOWING_SENTINEL"));
        assertTrue(byAnchor.get("following").get("body").asText().contains("FOLLOWING_SENTINEL"));
    }
    @Test void nestedCalloutsOwnTheirLabelsAndAnswers() {
        var doc = org.jsoup.Jsoup.parseBodyFragment("""
                <blockquote id="outer"><p><strong>SUPPLEMENT</strong> Outer</p>
                  <p>Outer body</p>
                  <blockquote id="inner"><p><strong>EXERCISE</strong> Inner</p>
                    <p>Question stays visible</p><p>【答案】</p><p>Answer only</p>
                  </blockquote>
                  <p>Outer ending</p>
                </blockquote>
                """);
        SiteBuilder.enhanceCallouts(doc);
        var outer = doc.getElementById("outer"); var inner = doc.getElementById("inner");
        assertEquals("extra", outer.parent().attr("data-kind"));
        assertTrue(outer.parent().selectFirst("summary").text().contains("Outer"));
        assertEquals(0, outer.children().stream().filter(e -> e.hasClass("answer-block")).count());
        assertEquals(1, inner.select(".answer-block").size());
        assertTrue(inner.selectFirst(".answer-block").text().contains("Answer only"));
        assertFalse(inner.selectFirst(".answer-block").text().contains("Question stays visible"));
        assertTrue(outer.text().contains("Outer ending"));
    }

    @Test void parentQuoteDoesNotStealNestedLabelOrInlineAnswerText() {
        var doc = org.jsoup.Jsoup.parseBodyFragment("""
                <blockquote id="parent"><blockquote id="child"><p><strong>WARNING</strong> Child</p><p>Warning body</p></blockquote></blockquote>
                <blockquote id="inline"><p>【答案】这里只是标记的解释。</p><p>Following body</p></blockquote>
                """);
        SiteBuilder.enhanceCallouts(doc);
        assertTrue(doc.getElementById("child").hasClass("callout-warning"));
        assertTrue(doc.getElementById("child").selectFirst(".callout-title").text().equals("Child"));
        assertTrue(doc.select(".answer-block").isEmpty());
        assertTrue(doc.getElementById("inline").text().contains("这里只是标记的解释"));
    }
}
