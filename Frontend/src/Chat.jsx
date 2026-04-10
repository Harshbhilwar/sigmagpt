import "./Chat.css"; 
import React, { useContext} from "react";
import { FiCopy, FiDownload } from "react-icons/fi";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useState } from "react";

function Chat() {
    const {newChat, prevChats} = useContext(MyContext);

    const [previewImage, setPreviewImage] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleDownload = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "ai-image.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed", err);
  }
};

const handleCopyImage = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);

  } catch (err) {
    console.error("Copy failed", err);
  }
};

    const iconBtnStyle = {
      padding: "6px",
      borderRadius: "8px",
      border: "none",
      background: "#000000aa",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease"
    };

    console.log("RENDER:", prevChats);

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {
                    prevChats.map((chat, idx) => {
                      console.log("IMAGE URL:", chat.content);
                      return (
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {chat.role === "user" ? (
                                <p className="userMessage">{chat.content}</p>

                            ) : chat.type === "loading" ? (

                                <div className="imageSkeleton">
                                    <p className="skeletonText">Generating image</p>
                                    <div className="gridPattern"></div>
                                </div>

                            ) : chat.type === "image" ? (

                                <div className="imageContainer" style={{ position: "relative", display: "inline-block" }}>
                                    <img
                                        src={chat.content}
                                        alt="AI generated"
                                        onClick={() => setPreviewImage(chat.content)}
                                        style={{
                                            width: "300px",
                                            height: "300px",
                                            objectFit: "cover",
                                            borderRadius: "10px",
                                            marginTop: "10px",
                                            cursor: "pointer"
                                        }}
                                    />

                                    <div style={{
                                        position: "absolute",
                                        bottom: "10px",
                                        right: "10px",
                                        display: "flex",
                                        gap: "8px"
                                    }}>
                                        <button onClick={() => handleCopyImage(chat.content)} style={iconBtnStyle}>
                                            <FiCopy size={16} />
                                        </button>

                                        <button onClick={() => handleDownload(chat.content)} style={iconBtnStyle}>
                                            <FiDownload size={16} />
                                        </button>
                                    </div>
                                </div>

                            ) : (
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {chat.content}
                                </ReactMarkdown>
                            )}
                        </div>
                      )
                    }

                        
                    )
                }

            </div>

            {copied && (
              <div
                style={{
                  position: "fixed",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#000",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  zIndex: 1000
                }}
              >
                Copied!
              </div>
            )}


            {previewImage && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setPreviewImage(null);
                  }
                }}

                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.9)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 999
                }}
              >

              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>


              <img
                src={previewImage}
                alt="preview"
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  borderRadius: "10px"
                }}
              />
              </div>
            )}
        </>
    )
}

export default Chat;