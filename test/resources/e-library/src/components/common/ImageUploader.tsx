import { fileToBase64 } from "@/common/base64";
import { Book } from "@/intefaces/interfaces";
import { Box, Button } from "@mui/material"
import { useEffect, useState } from "react";
import ReactImageUploading, { ImageListType, ImageType } from "react-images-uploading";

export const ImageUploader = ({
  image,
  setImage,
}: { image: any; setImage: (img: any) => void }) => {
  const [uploadedImage, setUploadedImage] = useState<ImageType[]>([]);

  useEffect(() => {
    if (image) {
      setUploadedImage([image]);
    } else {
      setUploadedImage([]);
    }
  }, [image]);

  const onImageChange = async (imageList: ImageListType) => {
    setUploadedImage(imageList);

    if (imageList.length === 0) {
      setImage(null);
      return;
    }

    const uploaded = imageList[0];
    if (!uploaded.file) return;

    const base64Data = await fileToBase64(uploaded.file);
    setImage({
      fileName: uploaded.file.name,
      contentType: uploaded.file.type,
      data: base64Data,
    });
  };

  return (
    <Box className="ml-[35px]">
      <ReactImageUploading
        value={uploadedImage}
        onChange={onImageChange}
        maxNumber={1}
        dataURLKey="data_url"
      >
        {({ onImageRemoveAll, onImageUpdate }) => (
          <div className="upload__image-wrapper">
            {uploadedImage.length > 0 && (
              <img src={uploadedImage[0].dataUrl} alt="" width="100" />
            )}
            <div className="image-item__btn-wrapper">
              <Button onClick={() => onImageUpdate(0)}>
                {uploadedImage.length === 0
                  ? "Select Cover for book"
                  : "Update Image"}
              </Button>
              <Button onClick={onImageRemoveAll}>Remove image</Button>
            </div>
          </div>
        )}
      </ReactImageUploading>
    </Box>
  );
};
