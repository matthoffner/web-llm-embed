"use client";
import ChatWindow from "./ChatWindow";


export default function Chat() {
  return (
    <div>
        <div className="flex justify-center m-3 gap-2">
          <div className="sm:w-[500px] w-full">
            <ChatWindow maxTokens={1000}/>
          </div>
        </div>
    </div>
  );
}