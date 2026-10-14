package com.flashops.api.auth;

import com.flashops.api.config.FlashOpsProperties;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Iterator;
import java.util.Locale;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfilePhotoStorage {

  private static final int AVATAR_SIZE = 512;
  private static final float JPEG_QUALITY = 0.82f;
  private static final long MAX_UPLOAD_BYTES = 2_000_000L;

  private final Path avatarsRoot;

  public ProfilePhotoStorage(FlashOpsProperties props) {
    this.avatarsRoot = Path.of(props.storage().avatarsDir()).toAbsolutePath().normalize();
    try {
      Files.createDirectories(avatarsRoot);
    } catch (IOException e) {
      throw new IllegalStateException("Impossible de créer le dossier avatars", e);
    }
  }

  public StoredPhoto store(int userId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "empty file");
    }
    if (file.getSize() > MAX_UPLOAD_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file too large");
    }
    String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
    if (!contentType.startsWith("image/")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid image type");
    }

    BufferedImage source;
    try (InputStream in = file.getInputStream()) {
      source = ImageIO.read(in);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid image data");
    }
    if (source == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid image data");
    }

    BufferedImage square = centerCropSquare(source);
    BufferedImage resized = resize(square, AVATAR_SIZE, AVATAR_SIZE);
    String filename = userId + ".jpg";
    Path target = avatarsRoot.resolve(filename).normalize();
    if (!target.startsWith(avatarsRoot)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid path");
    }

    try {
      writeJpeg(resized, target, JPEG_QUALITY);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "storage failed");
    }

    return new StoredPhoto(filename, Instant.now());
  }

  public void deleteIfExists(String filename) {
    if (filename == null || filename.isBlank()) {
      return;
    }
    Path file = avatarsRoot.resolve(filename).normalize();
    if (!file.startsWith(avatarsRoot)) {
      return;
    }
    try {
      Files.deleteIfExists(file);
    } catch (IOException ignored) {
      // best effort
    }
  }

  public byte[] read(String filename) {
    if (filename == null || filename.isBlank()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "photo not found");
    }
    Path file = avatarsRoot.resolve(filename).normalize();
    if (!file.startsWith(avatarsRoot) || !Files.isRegularFile(file)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "photo not found");
    }
    try {
      return Files.readAllBytes(file);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "read failed");
    }
  }

  private static BufferedImage centerCropSquare(BufferedImage source) {
    int w = source.getWidth();
    int h = source.getHeight();
    int side = Math.min(w, h);
    int x = (w - side) / 2;
    int y = (h - side) / 2;
    return source.getSubimage(x, y, side, side);
  }

  private static BufferedImage resize(BufferedImage source, int width, int height) {
    BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = out.createGraphics();
    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g.drawImage(source, 0, 0, width, height, null);
    g.dispose();
    return out;
  }

  private static void writeJpeg(BufferedImage image, Path target, float quality) throws IOException {
    Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
    if (!writers.hasNext()) {
      throw new IOException("no jpeg writer");
    }
    ImageWriter writer = writers.next();
    ImageWriteParam param = writer.getDefaultWriteParam();
    if (param.canWriteCompressed()) {
      param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
      param.setCompressionQuality(quality);
    }
    try (OutputStream os = Files.newOutputStream(target);
        ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
      if (ios == null) {
        throw new IOException("no image output stream");
      }
      writer.setOutput(ios);
      writer.write(null, new IIOImage(image, null, null), param);
    } finally {
      writer.dispose();
    }
  }

  public record StoredPhoto(String filename, Instant updatedAt) {}
}
