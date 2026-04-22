import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import {ScaleLoader} from "react-spinners";
import { track } from "@vercel/analytics";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats, setNewChat} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isImageMode, setIsImageMode] = useState(false);

    const generateImage = async (imagePrompt, originalPrompt) => {
        
        if (!imagePrompt || imagePrompt.trim() === "") return;
        setLoading(true);
        setNewChat(false);
        console.log("Calling image API...");
        track("image_generation_started", {
            length: imagePrompt.length,
        });


    const tempId = Date.now();
    console.log("ADDING LOADING MESSAGE");
    
        await new Promise(resolve => {
  setPrevChats(prev => [
    ...prev,
    { role: "user", content: originalPrompt },
    {
      role: "assistant",
      content: "Creating image...",
      type: "loading",
      id: tempId
    }
  ]);
  resolve();
});

    await new Promise(requestAnimationFrame);
        

    try {
        console.log("Fetching image...");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: imagePrompt })
        });

        if (!response.ok) {
            throw new Error("Image API failed");
        }

        const data = await response.json();

        await fetch(`${import.meta.env.VITE_API_URL}/api/image-save`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        threadId: currThreadId,
        prompt: originalPrompt,
        imageUrl: data.image
    })
});
        console.log("Image URL:", data.image);
        track("image_generated_success", {
            type: "image",
            length: imagePrompt.length
        });

        console.log("Image source:", data.source);



        setPrevChats(prev =>
            prev.map(chat =>
                chat.id === tempId
                    ? {
                        role: "assistant",
                        content: data.realImage || data.image,
                        display: data.image,
                        type: "image",
                        id: tempId
                      }
                    : chat
            )
        );

        setPrompt("");
        setLoading(false);   

    } catch (err) {
        console.log(err);
        track("api_error", {
            type: "image",
            message: err.message
        });
        setReply("Image generation failed");
        setLoading(false);
    }

    
};

    const getReply = async () => {
        console.log("Prompt:", prompt);

        if (!prompt.trim()) return;

        track("prompt_sent", {
            length: prompt.length,
        });

        setIsImageMode(false);

        const lowerPrompt = prompt.toLowerCase().trim();
    
    if (
        lowerPrompt.startsWith("/image") ||
        lowerPrompt.startsWith("generate image of") ||
        lowerPrompt.startsWith("generate image ")
    ) {
        setIsImageMode(true);

        const imagePrompt = lowerPrompt
        .replace("generate image of", "")
        .replace("generate image", "")
        .replace("/image", "")
        .replace("draw", "")
        .trim();

        if (!imagePrompt) {
            setLoading(false);
            setReply("Please enter what image you want to generate.");
            return;
        }

         // ✅ call fixed function
        await generateImage(imagePrompt, prompt);

        return; // VERY IMPORTANT
    }

    // ✅ NORMAL CHAT
    setLoading(true);
    setNewChat(false);

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: prompt,
            threadId: currThreadId
        })
    };

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, options);
        if (!response.ok) {
            throw new Error("Chat API failed");
        }
        const res = await response.json();
        track("ai_response_generated", {
            type: "chat",
        });

        setReply(res.reply);

    } catch (err) {
        console.log(err);
        track("api_error", {
           type: "chat",
           message: err.message
        });
    }

    setLoading(false);
};


// 👇 ADD HERE
useEffect(() => {
  const savedChats = localStorage.getItem("chatHistory");

  if (savedChats) {
    setPrevChats(JSON.parse(savedChats));
    setNewChat(false);
  }
}, []);

    useEffect(() => {
  const fetchChats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${currThreadId}`);
      const data = await res.json();

      if (data && data.length > 0) {
        setPrevChats(data);
        setNewChat(false);
      }
    } catch (err) {
      console.log("Failed to load chats", err);
    }
  };

  fetchChats();
}, [currThreadId]);

    useEffect(() => {
        if(prompt && reply && !isImageMode) {
            setPrevChats(prev => [
                ...prev,
                { role: "user", content: prompt },
                { role: "assistant", content: reply, type: "text" }
            ]);

            setPrompt("");
        }
        setIsImageMode(false);
    }, [reply]);

    useEffect(() => {
       localStorage.setItem("chatHistory", JSON.stringify(prevChats));
    }, [prevChats]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>SigmaAI <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            }
            <Chat></Chat>

            <ScaleLoader color="#fff" loading={loading}>
            </ScaleLoader>
            
            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                getReply();
                            }
                        }}
                    >
                           
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    SigmaAI can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;