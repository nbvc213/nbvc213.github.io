import java.nio.channels.FileChannel;
import java.nio.file.*;
import java.util.Arrays;

/** Hold an OS lock until the entire child build pipeline exits. */
class BuildGuard {
    public static void main(String[] args) throws Exception {
        if (args.length < 2) throw new IllegalArgumentException("Expected lock path and command");
        Path path = Path.of(args[0]).toAbsolutePath();
        Files.createDirectories(path.getParent());
        int code;
        try (var channel = FileChannel.open(path, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
             var lock = channel.lock()) {
            var child = new ProcessBuilder(Arrays.copyOfRange(args, 1, args.length)).inheritIO().start();
            code = child.waitFor();
        }
        System.exit(code);
    }
}
