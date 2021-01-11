import React, { useEffect, useState } from 'react';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import './ImageViewer.css';

export default function ImageViewer() {
  const [imageList, setImageList] = useState([]);
  const [showImgIndex, setShowImgIndex] = useState(-1);
  useEffect(() => {
    function handleShowImage({ imagesList, index }) {
      setImageList(imagesList);
      setShowImgIndex(index);
    }
    window.document.body.className = window.document.body.className.replace('loading', '');
    window.wizApi.userManager.on('showImage', handleShowImage);
    return () => {
      window.wizApi.userManager.off('showImage', handleShowImage);
    };
  }, []);

  return (
    <div className="imageViewer">
      <img className="showImage" src={imageList?.[showImgIndex]} alt="" />
      {showImgIndex !== 0 ? (
        <button type="button" className="imageBtn preBtn" onClick={() => setShowImgIndex((index) => index - 1)}>
          <ArrowBackIosIcon fontSize="large" />
        </button>
      ) : null}

      {showImgIndex !== imageList.length - 1 ? (
        <button type="button" className="imageBtn nextBtn" onClick={() => setShowImgIndex((index) => index + 1)}>
          <ArrowForwardIosIcon fontSize="large" />
        </button>
      ) : null}


    </div>
  );
}
