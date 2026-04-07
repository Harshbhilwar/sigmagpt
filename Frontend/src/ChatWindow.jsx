import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import {ScaleLoader} from "react-spinners";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats, setNewChat} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isImageMode, setIsImageMode] = useState(false);

    const generateImage = async (imagePrompt, originalPrompt) => {
        setNewChat(false);
        console.log("Calling image API...");


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
        const response = await fetch("http://localhost:8080/api/image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: imagePrompt })
        });

        const data = await response.json();

        await fetch("http://localhost:8080/api/image-save", {
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
        setReply("Image generation failed");
    }

    
};

    const getReply = async () => {
        console.log("Prompt:", prompt);

        if (!prompt.trim()) return;

    
    if (
        prompt.startsWith("/image") ||
        prompt.toLowerCase().includes("generate image")
    ) {
        setIsImageMode(true);
        const imagePrompt = prompt
        .toLowerCase()
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
        generateImage(imagePrompt, prompt);

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
        const response = await fetch("http://localhost:8080/api/chat", options);
        if (!response.ok) {
            throw new Error("Failed to generate image");
        }
        const res = await response.json();

        setReply(res.reply);

    } catch (err) {
        console.log(err);
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
      const res = await fetch(`http://localhost:8080/api/thread/${currThreadId}`);
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
                <span>SigmaGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem"><i class="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i class="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
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
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;