document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.querySelector('input[name="title"]');
  const slugInput = document.querySelector('input[name="slug"]');
  const bodyInput = document.getElementById("body");
  const fileInput = document.getElementById("image-file");
  const uploadButton = document.getElementById("upload-image-button");
  const uploadPanel = document.querySelector("[data-upload-url]");
  const uploadStatus = document.getElementById("upload-status");

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

  document.querySelectorAll("[data-insert-markdown]").forEach((button) => {
    button.addEventListener("click", () => {
      insertAtCursor(bodyInput, button.dataset.insertMarkdown || "");
    });
  });

  uploadButton?.addEventListener("click", async () => {
    if (!uploadPanel || !fileInput || !fileInput.files || fileInput.files.length === 0) {
      if (uploadStatus) {
        uploadStatus.textContent = "Choose an image file first.";
      }
      return;
    }

    const uploadUrl = uploadPanel.getAttribute("data-upload-url");
    if (!uploadUrl) {
      return;
    }

    const payload = new FormData();
    payload.append("image", fileInput.files[0]);

    uploadButton.disabled = true;
    if (uploadStatus) {
      uploadStatus.textContent = "Uploading image...";
    }

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: payload,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Upload failed.");
      }

      insertAtCursor(bodyInput, json.markdown || "");
      fileInput.value = "";
      if (uploadStatus) {
        uploadStatus.textContent = `Uploaded ${json.filename}. Markdown inserted into the body. Save the draft to refresh the preview.`;
      }
    } catch (error) {
      if (uploadStatus) {
        uploadStatus.textContent = error.message || "Upload failed.";
      }
    } finally {
      uploadButton.disabled = false;
    }
  });
});
