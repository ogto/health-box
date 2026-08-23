package healthBoxApi;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/health-box")
public class HealthBoxFileController {

    private static final int MAX_FILES_PER_REQUEST = 10;
    private static final long MAX_FILE_SIZE = 10L * 1024L * 1024L;

    private final Path uploadDirectory;

    public HealthBoxFileController(@Value("${health-box.upload.directory}") String uploadDirectory) {
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void initializeUploadDirectory() throws IOException {
        Files.createDirectories(uploadDirectory);
    }

    @PostMapping(value = "/admin/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<UploadedFileResponse> uploadFiles(@RequestParam("files") List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty() || files.size() > MAX_FILES_PER_REQUEST) {
            throw new IllegalArgumentException("between 1 and " + MAX_FILES_PER_REQUEST + " image files are required");
        }

        List<UploadedFileResponse> uploadedFiles = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedFiles.add(storeFile(file));
        }
        return uploadedFiles;
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) throws IOException {
        if (!fileName.matches("[a-f0-9-]{36}\\.(jpg|jpeg|png|gif|webp|avif)")) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = uploadDirectory.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadDirectory) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        MediaType mediaType = StringUtils.hasText(contentType)
            ? MediaType.parseMediaType(contentType)
            : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
            .contentType(mediaType)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
            .body(resource);
    }

    private UploadedFileResponse storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("empty image file is not allowed");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("image file exceeds 10MB");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType) || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("only image files are allowed");
        }

        String extension = extensionForContentType(contentType);
        String storedFileName = UUID.randomUUID().toString() + "." + extension;
        Path target = uploadDirectory.resolve(storedFileName).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalStateException("invalid HealthBox upload target");
        }
        file.transferTo(target.toFile());

        String downloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/health-box/files/")
            .path(storedFileName)
            .toUriString();
        return new UploadedFileResponse(downloadUri, storedFileName, contentType, file.getSize());
    }

    private String extensionForContentType(String contentType) {
        String normalized = contentType.toLowerCase(Locale.ROOT);
        if ("image/jpeg".equals(normalized) || "image/jpg".equals(normalized)) {
            return "jpg";
        }
        if ("image/png".equals(normalized)) {
            return "png";
        }
        if ("image/gif".equals(normalized)) {
            return "gif";
        }
        if ("image/webp".equals(normalized)) {
            return "webp";
        }
        if ("image/avif".equals(normalized)) {
            return "avif";
        }
        throw new IllegalArgumentException("unsupported image content type");
    }

    public static class UploadedFileResponse {
        private final String fileDownloadUri;
        private final String fileName;
        private final String fileType;
        private final long size;

        public UploadedFileResponse(String fileDownloadUri, String fileName, String fileType, long size) {
            this.fileDownloadUri = fileDownloadUri;
            this.fileName = fileName;
            this.fileType = fileType;
            this.size = size;
        }

        public String getFileDownloadUri() {
            return fileDownloadUri;
        }

        public String getFileName() {
            return fileName;
        }

        public String getFileType() {
            return fileType;
        }

        public long getSize() {
            return size;
        }
    }
}
