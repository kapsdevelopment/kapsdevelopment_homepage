document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.querySelector('input[name="title"]');
  const slugInput = document.querySelector('input[name="slug"]');
  const bodyInput = document.getElementById("body");
  const fileInput = document.getElementById("image-file");
  const uploadButton = document.getElementById("upload-image-button");
  const uploadPanel = document.querySelector("[data-upload-url]");
  const uploadStatus = document.getElementById("upload-status");
  const dropZone = document.getElementById("image-drop-zone");
  const allowedImageExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[’'`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");

  if (slugInput) {
    slugInput.dataset.touched = "false";
    slugInput.addEventListener("input", () => {
      slugInput.dataset.touched = "true";
    });
  }

  titleInput?.addEventListener("input", () => {
    if (!slugInput || slugInput.dataset.touched === "true") {
      return;
    }

    const nextSlug = slugify(titleInput.value);
    if (nextSlug) {
      slugInput.value = nextSlug;
    }
  });

  const insertAtCursor = (textarea, text) => {
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const prefix = textarea.value.slice(0, start);
    const suffix = textarea.value.slice(end);
    const spacerBefore = prefix && !prefix.endsWith("\n\n") ? "\n\n" : "";
    const spacerAfter = suffix && !suffix.startsWith("\n\n") ? "\n\n" : "";

    textarea.value = `${prefix}${spacerBefore}${text}${spacerAfter}${suffix}`;
    const cursorPosition = (prefix + spacerBefore + text).length;
    textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  };

  const setUploadStatus = (message) => {
    if (uploadStatus) {
      uploadStatus.textContent = message;
    }
  };

  const extensionFromMime = (mimeType) => {
    const imageTypes = {
      "image/avif": "avif",
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    return imageTypes[mimeType] || "";
  };

  const extensionFromName = (filename) => {
    const match = (filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  };

  const imageTimestamp = () => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join("");
  };

  const ensureNamedImageFile = (file, fallbackStem) => {
    const namedExtension = extensionFromName(file.name);
    if (namedExtension && allowedImageExtensions.has(namedExtension)) {
      return file;
    }

    const mimeExtension = extensionFromMime(file.type);
    if (!mimeExtension) {
      return file;
    }

    return new File([file], `${fallbackStem}.${mimeExtension}`, {
      type: file.type,
      lastModified: Date.now(),
    });
  };

  const isSupportedImage = (file) => {
    const namedExtension = extensionFromName(file.name);
    const mimeExtension = extensionFromMime(file.type);
    return allowedImageExtensions.has(namedExtension) || allowedImageExtensions.has(mimeExtension);
  };

  const supportedImageFiles = (fileList, sourceLabel) => {
    const files = Array.from(fileList || []);
    const timestamp = imageTimestamp();
    const supported = files
      .filter((file) => isSupportedImage(file))
      .map((file, index) => ensureNamedImageFile(file, `${sourceLabel}-image-${timestamp}-${index + 1}`));

    if (files.length > 0 && supported.length === 0) {
      setUploadStatus("No supported image files found. Use png, jpg, jpeg, webp, gif, or avif.");
    } else if (supported.length < files.length) {
      setUploadStatus("Some files were skipped because only png, jpg, jpeg, webp, gif, and avif are supported.");
    }

    return supported;
  };

  const uploadImageFile = async (file) => {
    const uploadUrl = uploadPanel?.getAttribute("data-upload-url");
    if (!uploadUrl) {
      throw new Error("Upload URL is missing.");
    }

    const payload = new FormData();
    payload.append("image", file);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: payload,
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Upload failed.");
    }

    return json;
  };

  const uploadImagesIntoBody = async (files, sourceLabel) => {
    if (!files.length) {
      return;
    }

    if (uploadButton) {
      uploadButton.disabled = true;
    }
    setUploadStatus(`Uploading ${files.length} image${files.length === 1 ? "" : "s"} from ${sourceLabel}...`);

    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadImageFile(file));
      }

      insertAtCursor(
        bodyInput,
        uploaded
          .map((item) => item.markdown || "")
          .filter(Boolean)
          .join("\n\n")
      );

      if (fileInput) {
        fileInput.value = "";
      }

      const filenames = uploaded.map((item) => item.filename).filter(Boolean);
      const filenameText =
        filenames.length > 2 ? `${filenames.slice(0, 2).join(", ")} and ${filenames.length - 2} more` : filenames.join(", ");
      setUploadStatus(
        `Uploaded ${filenameText || "image"}. Markdown inserted into the body. Save the draft to refresh the preview.`
      );
    } catch (error) {
      setUploadStatus(error.message || "Upload failed.");
    } finally {
      if (uploadButton) {
        uploadButton.disabled = false;
      }
      dropZone?.classList.remove("is-dragging");
    }
  };

  document.querySelectorAll("[data-insert-markdown]").forEach((button) => {
    button.addEventListener("click", () => {
      insertAtCursor(bodyInput, button.dataset.insertMarkdown || "");
    });
  });

  uploadButton?.addEventListener("click", async () => {
    if (!uploadPanel || !fileInput || !fileInput.files || fileInput.files.length === 0) {
      setUploadStatus("Choose an image file first.");
      return;
    }

    const files = supportedImageFiles(fileInput.files, "selected");
    await uploadImagesIntoBody(files, "file picker");
  });

  bodyInput?.addEventListener("paste", async (event) => {
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const imageFiles = clipboardItems
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    const files = supportedImageFiles(imageFiles, "pasted");
    await uploadImagesIntoBody(files, "clipboard");
  });

  const dragHasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

  const handleDragOver = (event) => {
    if (!dragHasFiles(event)) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    dropZone?.classList.add("is-dragging");
  };

  const handleDragLeave = (event) => {
    if (!dropZone?.contains(event.relatedTarget)) {
      dropZone?.classList.remove("is-dragging");
    }
  };

  const handleDrop = async (event) => {
    if (!dragHasFiles(event)) {
      return;
    }

    event.preventDefault();
    dropZone?.classList.remove("is-dragging");

    const files = supportedImageFiles(event.dataTransfer?.files, "dropped");
    await uploadImagesIntoBody(files, "drag and drop");
  };

  [dropZone, bodyInput].forEach((target) => {
    target?.addEventListener("dragenter", handleDragOver);
    target?.addEventListener("dragover", handleDragOver);
    target?.addEventListener("dragleave", handleDragLeave);
    target?.addEventListener("drop", handleDrop);
  });
});
