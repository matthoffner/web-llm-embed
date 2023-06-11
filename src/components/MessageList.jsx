import useLLM from "@react-llm/headless";
import { useEffect, useRef } from "react";
import { MemoizedReactMarkdown } from './Markdown'
import { CodeBlock } from './CodeBlock'
import { ScrollView } from "react95";

function MessageList({
  fileMode
}) {
  const scrollRef = useRef(null);
  const { conversation, userRoleName } = useLLM();
  const messages = conversation?.messages || [];

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, messages.length]);

  return (
    <ScrollView style={{ height: "65vh" }} className="w-full">
      <div className="p-2 leading-6 w-full min-h-full">
        {conversation?.messages.map((m) => (
          <div key={m.id} style={{ display: "flex" }}>
            <div
              style={{
                paddingTop: "5px",
                paddingBottom: "5px",
                paddingRight: "15px",
                paddingLeft: "15px",
                margin: "5px",
                borderRadius: "15px",
                backgroundColor: m.role === userRoleName ? "green": "#333333"
              }}
            >
              <MemoizedReactMarkdown
                className="prose dark:prose-invert flex-1"
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (children.length) {
                      if (children[0] == '▍') {
                        return <span className="animate-pulse cursor-default mt-1">▍</span>
                      }

                      children[0] = (children[0]).replace("`▍`", "▍")
                    }

                    const match = /language-(\w+)/.exec(className || '');

                    return !inline ? (
                      <CodeBlock
                        key={Math.random()}
                        language={(match && match[1]) || ''}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                        {children}
                      </table>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="break-words border border-black px-3 py-1 dark:border-white">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {m.text}
              </MemoizedReactMarkdown>
              
            </div>
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>
    </ScrollView>
  );
}

export default MessageList;