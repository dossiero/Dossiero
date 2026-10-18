import type { PersonInput } from "@shared/types";

const PROFILE_THUMBNAIL_SIZE = 320;
const PROFILE_THUMBNAIL_QUALITY = 0.84;

export async function prepareProfilePhoto(file: File): Promise<{
  profilePhoto: PersonInput["profilePhoto"];
  profileThumbnail: PersonInput["profileThumbnail"];
}> {
  const originalBytes = new Uint8Array(await file.arrayBuffer());
  const profilePhoto = {
    name: file.name,
    type: file.type,
    size: originalBytes.byteLength,
    bytes: originalBytes,
  };

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_THUMBNAIL_SIZE;
    canvas.height = PROFILE_THUMBNAIL_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas unavailable");
    }

    const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    );
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", PROFILE_THUMBNAIL_QUALITY);
    });
    if (!blob) {
      throw new Error("Thumbnail encoding failed");
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    return {
      profilePhoto,
      profileThumbnail: {
        name: "profile-thumbnail.webp",
        type: "image/webp",
        size: bytes.byteLength,
        bytes,
      },
    };
  } catch {
    return { profilePhoto, profileThumbnail: undefined };
  }
}
