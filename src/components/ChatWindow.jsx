import useLLM from "@react-llm/headless";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import MessageList from './MessageList';
import {FileLoader} from './FileLoader';
import Loader from "./Loader";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { XenovaTransformersEmbeddings } from '../embed/hf';
import { MemoryVectorStore } from "langchain/vectorstores/memory";  

import {
  Button,
  TextInput,
} from "react95";

function ChatWindow({
  stopStrings,
  maxTokens,
}) {
  const { loadingStatus, send, isGenerating, deleteMessages } = useLLM();
  const [fileText, setFileText] = useState();
  const [userInput, setUserInput] = useState("");  

  const handleChange = (event) => {
    setUserInput(event.target.value);
  };

  const isReady = loadingStatus.progress === 1;

  const handleClearChat = () => {
    deleteMessages();
  }

  const handleClearFile = () => {
    setFileText(null);
  }

  const qaHandler = async (fileText, userInput) => {
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
      const docs = await textSplitter.createDocuments([fileText]);
      let qaPrompt;
      try {
        const vectorStore = await MemoryVectorStore.fromTexts(
          [...docs.map(doc => doc.pageContent)],
          [...docs.map((v, k) => k)],
          new XenovaTransformersEmbeddings()
        )
        const queryResult = await vectorStore.similaritySearch(userInput, 2);
        qaPrompt = 
      `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
        You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
        If you can't find the answer in the context below, just say "Hmm, I'm not sure." Don't try to make up an answer.
        If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
        Question: ${userInput}
        =========
        ${queryResult.map(result => result.pageContent).join('')}
        =========
        Answer:
        `
        return qaPrompt;
      } catch (err) {
        console.log(err);
      }
  }

  const handleSubmit = useCallback(async () => {
    if (isGenerating || !isReady) {
      return;
    }
    
    if (fileText) {
      const qaPrompt = await qaHandler(fileText, userInput);
      send(qaPrompt, maxTokens, stopStrings);
    } else {
      send(userInput, maxTokens, stopStrings);
    }
    
    setUserInput("");
  }, [
    userInput,
    send,
    isGenerating,
    isReady,
    maxTokens,
    stopStrings,
    fileText
  ]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleSubmit]);

  const loadFile = async (fileText) => {
    console.log('file loaded, demo mode');
    if (fileText) {
      const qaPrompt = await qaHandler(fileText, "Based on the context what are some interesting questions you can help answer");
      send(qaPrompt, maxTokens, stopStrings);
    }
  }

  useEffect(() => {
    loadFile(fileText);

  }, [fileText])

  return (
    <div className="window sm:w-[500px] w-full">
      
      <div className="window-content w-full">
        <div className="flex flex-col w-full">
          <MessageList
            screenName={"me"}
            assistantScreenName={"vicuna"}
          />
          {/* <Separator /> */}
          <div className="h-4" />
          {isReady && (
            <div>
              <form onSubmit={handleSubmit}>
                <div className="flex" style={{ color: 'white', textarea: { color: 'white' } }}>
                   <TextInput
                    value={userInput}
                    placeholder="Say something..."
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </div>
              </form>
              
              <div className="flex justify-start m-2">
                
                  <div>
                  <Button
                    onClick={handleSubmit}
                    className="submit"
                    style={{ backgroundColor: "black", height: "65px", width: "65px", float: "right" }}
                  >
                    <Image
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7d13nF11nf/x17kzEzoJHZQihC66lAgYEIzJzISmq0IAERZXBdfCruWxurpqcNe6v1UBV8W1UlSKsggCk0kMKFWqtNAJTUghmUAKmXLP749JTAKTZMq953PuOa/n4+EDmcw95/0IM/N5z/d77jkJkvIvJWEa29DE1vQxhmTF/6or/gmjSRhDSguwKQkbUWVDEjYFWlYcZWNgg/WcaTmwdMX/7yFlMQnLgFeAxST0kNIFLCKliwpdpCv+10QXfcynnbl1+BuQVGNJdACp9DrYlpQdqbAjCbuQsiOwAynbAK8jYRtgG6A5Nuig9QLzgLmkPA/MJeEFEp4l5SkSnqGHZzmaecE5pVKzAEj1dg0b0MSuwO5U2J2U3UkZS8JuwM7AhsEJo7wCPE3KEyQ8BjxGwmP08hgv8yRT6I4OKBWZBUCqlQ42AfamwhtJ2RfYl5R9SdgVqASnazR9pMwm4QFSHiThQVIepJtZHPe3LQpJI2ABkIZjJtvTzQEkHAAcABwI7IrfU/VWJeVJEu4i5W7gHkZxNxN4ITqY1Gj8YSWtz0zG0MshpBwCHEL/wN8hOJXW9DxwF/BnEm6jmduYQFd0KCnPLADS6vqvtn8jCYcDh9I/8PfC75VGkwIPAbcBt1LlRtp5kIQ0OJeUG/5QU7ldShObszcJh5EwCZgAbB0dS3XxEil/JmE6CTexBbcxjp7oUFIUC4DK51r2oplWUlqBI4HR0ZEUoouUG0jopEInk3gkOpCUJQuAim86W9FHKxVaSZlE/1vvpFd7CugkoZM+pjOZBdGBpHqyAKiYprMbVY4j5VgSjmTV3fCkwegD7iHlauAq2rkzOpBUaxYAFcNMmunhSOCdwLHAbsGJVCQpj5NwNSm/YxE3MIW+6EjSSFkA1LgupYkteCspJwAnAttFR1IpLAB+T8plLKLDOxaqUVkA1FiuYQNamEyVKSQcgxfwKVYXcDUpl1oG1GgsAMq/qVQ4jPErftM/mf4H40h5s5D+MnAZi7jGbQLlnQVA+dXJm6hyGgknATtGx5GG4BngV1S5gMk8EB1GGogFQPkykzF0M4WE04DDouNINfAgcAEt/IQJzI8OI61kAVC8qVQ4nDZSTifl74ENoiNJdfAKcAXwc25mOlOpRgdSuVkAFKeDbUn4AHAm/U/Sk8riOVJ+DHyfduZGh1E5WQCUvQ4OosIZpJwKbBQdRwrUDVxJhR8xkRk+rEhZsgAoGzezEUt4PylnAftFx5FyJ+VeEr5DF7/07YTKggVA9TWT7enmIyR8DJ+yJw3GHFJ+SBPnMYkXo8OouCwAqo/pvIUqnwLei/fhl4ZjMSk/o4nvMoknosOoeCwAqq1ODgc+S8qx0VGkgqiScA1Vvk47N0eHUXFYADRyU6nwVo4h4d+Bg6PjSAV2JwnnspCLvdOgRsoCoOG7gxYWcjopn8On70lZepSUb7AVFzKOnugwakwWAA1d/+A/mZQvArtHx5FK7CngO/TyQ45meXQYNRYLgAbvUkaxBSdR5UskjI2OI+lvnga+TQvnM4FXosOoMVgAtH4zaaab00j4MrBzdBxJazWblKks4iKvEdD6WAC0btOZRB//TcKbo6NIGrSHgC/RyuXeXVBrYwHQwKYziSpfB8ZFR5E0bH8GPk8bM6KDKH8sAFpTJ/uQ8l/AMdFRJNVIynSa+DSTuDc6ivLDAqB+M9maHr4IfAxoio4jqeaqwMW08K9M4IXoMIpnASi7q9iYDfgE8Hlg8+g4kupuCfA9WvhPJrA4OoziWADKrIPjSDgP2CU6iqTMPUfC52nlguggimEBKKNr2YsmzgHao6NICpYwkypn0c790VGULQtAmcxkDD18DvgkMCo6jqTc6AW+T8KXaGVRdBhlwwJQFh2cSMI5wHbRUSTl1vOknEU7l0cHUf1ZAIruOnagwveA90RHkdQgEq6mykdp55noKKof3+5VVCkJ4zmDCr8D9o+OI6mh7EnCP3IqyxjL7Vzv3QSLyBWAIrqO3WniR6RMiI4iqeHdRMKHaWVWdBDVlgWgSO6ghQV8Cjgb2CA6jqTC6AG+TRdfYgrd0WFUGxaAoujkAODHpBwYHUVSYd1Hyodp57boIBo5C0Cj62ATEr4KfAKoRMeRVHh9pJxHN1/gOJZGh9HwWQAa2TTGARcDe0ZHkVQyCQ9T5RTauTM6iobHAtCIUhI6OQv4Ft7QR1KcXlK+yiL+gyn0RYfR0FgAGk0HO5FwIXBkdBRJAvpvJ9zDaRzNs9FRNHjuGTeSDo4n4R4c/pLyJGUCzdxPJ++LjqLBcwWgEVzJZmzM/yPljOgokrQeF7KMj/EuXo4OonWzAORdB4eQcBGwe3QUSRqk2cD7aeOm6CBaOwtAXs2kmR6+CHweaI6OI0lD1At8hS6+5gWC+WQByKOZbE0PvwYmRkeRpBG6gQonMok50UG0JgtA3nRwEAm/AXaJjiJJNfIsKcd7B8F88V0AedLBGSTcjMNfUrHsSMINdPLh6CBaxRWAPLiGDWjme8CHoqNIUp1dyKacyXiWRQcpOwtAtP4b+1wOHBwdRZIykXAXvbyXo5gdHaXM3AKI1MnbSbgDh7+kMkk5kCZup4PW6ChlZgGIkJIwjc+SMh3YNjqOJAXYmoRrV/wsdDU6gH/pWet/fO8FwHuio0hSTlzGck738cLZcgUgSzPZnoTrcfgrh7YdtS0VfyQoxglswEyms110kDLxuz0r1/FGergVGBcdRXq1nTbciScOf4L7x99vCVCUg6lyC53sEx2kLPxOz8I0JlLhRnx/v3Jopw13Ytb4WWzStAn7bLKPJUCRdiXlJq5jQnSQMvC7vN6mcTpwLTAmOIn0GqsP/5UsAQq2BRWuo5PTooMUnd/h9ZKS0MFU4GdAS3Aa6TUGGv4rWQIUbBQpP6eDqb5DoH78i62HSxnFGH4CvD86ijSQdQ3/1c1aMov9bt6PKtWMkkmv8Qu6OIMpdEcHKRoLQK1dzRaM4rfA26OjSAMZ7PBfyRKgHPgDLbyXCXRFBykSC0AtzWAX+rgO2Ds6ijSQoQ7/lSwByoEHSZlMO89EBykKC0CtdLArCTOAXaOjSAMZ7vBfyRKgHHgamEQbj0YHKQKv8KmFTvYh4UYc/sqpkQ5/8MJA5cLOpPyRTt4UHaQI/E4eqes4kJQ/Aq+LjiINpBbDfyVLgMIlbE/K9VznQ9RGyu/ikejkcCr8Adg6Ooo0kFoO/5UsAcqBLakwjQ7GRwdpZH4HD1cnbweuAUYHJ5EGVI/hv5IlQDkwmoRpPlJ4+PzuHY5OjiHlWlI2i44iDaSew38lS4ByYBMSrqKDv48O0oj8zh2qTqaQcgWwYXQUaSBZDP+VLAHKgQ1IuIRpnBAdpNH4XTsUHZxCysV4a1/lVJbDfyVLgHJgFPArOvlAdJBG4n0ABqv/oT4/wdKknIoY/qvzPgHKgSoJH6CVC6KDNAILwGB08h5SLgGao6NIA4ke/itZApQDfaScQjuXRAfJOwvA+nTSTsqVwAbRUaSB5GX4r2QJUA70kPIe2rk6OkieWQDWZRoTgavxgj/lVN6G/0qWAOXAMqocw2RmRgfJKwvA2kznrVSZBmwaHUUaSF6H/0qWAOXAUqpMZjJ/ig6SRxaAgUxjf+APwBbRUaSB5H34r2QJUA4sImUi7dwZHSRvLACv1sF+JFwPbBUdRRpIowz/lSwByoH5VHk7k3kgOkieWABWdx27U+GPwA7RUaSBNNrwX8kSoByYQx9HchQPRwfJCwvASjPYhT7+BOwUHUUaSKMO/5UsAcqB2aQcQTvPRAfJAwsAQCejSbkR2C86ijSQRh/+K1kClAMP0s3hHMvC6CDRvKvdHbSQ8hsc/sqpogx/8LbByoV9GcUVXOO9Xcr9XZiSsICfABOjo0gDKdLwX8kSoBw4kmZ+RlruVfByfwd2cjZwanQMaSBFHP4rWQKUAyfTyRejQ0Qqb/vp5AOk/DQ6hjSQIg//1XlNgIKlJJxe1ocHlbMAdPJ2Ujrof4SklCtlGf4rWQIUrAc4ijZmRAfJWvkKwHT2pcpNwJjoKNKrlW34r2QJULBFpBxOO/dHB8lSuQrATLanh1uBXaKjSK9W1uG/kiVAwWZT4VAmMSc6SFbKcwXOzWxED/+Hw185VPbhD14YqHBvoMrVdFCab8JyfKelJCzmYuCQ6CjSqzn8V7EEKNg4kvK8PbAc32Wd/Bvw7ugY0qs5/F/LEqBgJzCdT0eHyELxW840JgIdQFN0FGl1Dv9185oABeoDjqaNadFB6qnYBaCTnUm5E9g6Ooq0Oof/4FgCFOhF+hjHUcyODlIvxV1jm8mGK+7x7/BXrjj8B8/tAAXaiiYuKfIzA4r7XdXL/wDjomNIq3P4D50lQIEOpoVzo0PUSzG/ozr5J1L+MTqGtDqH//BZAhQm5Qw6+GB0jHoo3jUAHRxCwg1Q3GUbNR6Hf214TYCCvEKFI5jE7dFBaqlYBaCDbUm4E9gxOoq0ksO/tiwBCvI0vYzjaOZFB6mV4qynzaSZhEtw+CtHHP6153aAguxMMxdzaXHeUl6c76Aevgi8PTqGtJLDv34sAQrSyhZ8LjpErRRjC6CD8ST8EW/2o5xw+GfD7QAF6CXhbbRya3SQkWr8AjCTTenhLmCP6CgSOPyzZglQ5lIe5xUO4F28HB1lJBp//ayH7+PwV044/LPndoAylzCWjfhOdIyRauwVgA6OJ+Gy6BgSOPyjuRKgzKWcRDuXRMcYrsatzNewIwnnR8eQAMY0j+Hq/a92+AfaZ5N9OHfvc0ka/PcaNZCEH9LJztExhqsxC8BUKrRwAbBldBRpdPNoOg7s4M2bvTk6Sul9bKeP8cN9fmgJUFbGkHJho741sCFD83n+DYp5a0Y1ltHNo5l24DQOHn1wdBStcNDmB7HDBjvw+/m/j46ictiFDVjMRdwcHWSoGq8md3AQCTcDo6KjqNwc/vn2o2d/xEdmfYSUNDqKiq+HCoc12q2CG6sAdLAJCXcBe0ZHUbk5/BuDJUAZmsVyxnEcS6ODDFZjXQOQ8DUc/grm8G8cZ+x4htcEKCv7MIqzo0MMReN8V1zHwVS4mUa9bkGF4PBvTK4EKCN9wKG0cUd0kMFojBWAmTRT4Xwc/grk8G9crgQoI02k/IQ7aIkOMhiNUQB6+Dywf3QMlZfDv/FZApSJhDfzIp+JjjEY+f9OuJa9aOIeYMPoKConh3+xuB2gDCwn4QBamRUdZF3yvQIwlQpN/BiHv4I4/IvHlQBlYANSfkCa7y+yfO+pf56PAh+JjqFycvgXlzcLUgbewJM8x4XcFR1kbfLbTqbxOuABYEx0FJWPw78c3A5QnS2iiTcykeeigwwkv1sAKd/H4a8ADv/ycDtAdTaaXs6JDrE2+dwC6OAkEr4QHUPl4/AvH7cDVFcJ+3Iq93IhD0VHebX81d6ZjKGHh4DtoqOoXBz+5eZ2gOroryxjb97Fy9FBVpe/LYAepuLwV8Yc/nI7QHX0Ojbi36NDvFq+vtKv441UuBsa4y5KKgaHv1bnSoDqpJuUv6M9P1sB+VoBaOI8HP7KkMNfr+ZKgOpkFHBedIjV5eciwA5Ogsa4faKKweGvtfHCQNVFwm55uiAwHxW3g01IeAjYMTqKysHhr8FwO0B1MJsW9mECr0QHyccWQIXP4PBXRhz+Giy3A1QHb6CXf4kOAXlYAZjOdqQ8Sspm0VFUfA5/DYcrAaqphJdpZk8m8EJkjPgVgJSvOfyVBYe/hsuVANVUymb08OXoGLFfzdN5M1XuIk8XI6qQHP6qBVcCVEN9pOxPO/dHBYhdAajyXzj8VWcOf9WKKwGqoSYSvhkZIO6reBptQEfY+VUKDn/VgysBqpkq72AyMyNOHbMCkJIAXwk5t0rD4a96cSVANVPhGytmYuZilt8P4wTgkyHnVik4/FVv3ixINfJ6HudOLuKRrE+cfQG4lCY25FJgm8zPrVJw+CsrlgDVRMKbGMv5XJ/tnlL2WwCjOR3YJ/PzqhQc/sqa2wGqgf14KydnfdJsv2KvYQOaeQTYOdPzqhQc/orkhYEakZTH2Yp9GEdPVqfMdgWghX/E4a86cPgrmisBGpGEsbzIqdmeMit30MICHgHekNk5VQoOf+WJKwEagSdoYS8m0JvFybJbAVjAP+LwV405/JU3rgRoBHajh/dndbJsvkL7f/t/GNg1k/OpFBz+yjNXAjQsKY8zir2zWAXIZgVgIafj8FcNOfyVd64EaFgSxtLNKVmcqv73Aeh/3/8lwBZ1P5dKweGvRuF9AjQsCfsylu/X+74A9V8BGMMUYLe6n0el4PBXo3ElQMOwJ4fx7nqfpP4FIOEzdT+HSsHhr0ZlCdCQpXy23qeobwGYzmRSDqzrOVQKDn81OkuAhugtdPCOep6gvgWgWv8Go+Jz+KsoLAEakqS+M7R+X4XXcTAVbqvb8VUKDn8VkW8R1KAlHEgrd9fj0PVbAaj4uF+NjMNfReVKgAYtrd8src9X3wxeTx9PAi11Ob4Kz+GvMnAlQIPQQxO7MpHnan3g+qwA9PJxHP4aJoe/ysKVAA1CC32cWY8D1/6r7mY2YjHPAFvV/NgqPIe/ysiVAK3HPDZlF8azrJYHrf0KwMucisNfw+DwV1m5EqD12IaXeV+tD1r7ApDwiZofU4Xn8FfZWQK0HmfV+oC1LQAdHAHsV9NjqvAc/lI/S4DWKuHNdDC+loesbQFI+KeaHk+F5/CX1mQJ0FolfKS2h6uVa9iGZp4BNqjZMVVoDn9p7bwwUANYTi87cTTzanGw2q0ANPEhHP4aJIe/tG6uBGgAG9DCP9TqYE01OcpUKuzML4AtanI8FZrDXxqcgzY/iB022IHfz/99dBTlRcpYdud7XD/ypaHarAAcThuwa02OpUJz+EtD40qA1pAwlvFMqMWhalMAqnygJsdRoTn8peGxBOhVTq/FQUb+1XQdW1LhOWDDkcdRUTn8pZHzwkCtsIwWXscEukZykJGvAFQ4GYe/1sHhL9WGKwFaYSO6mTLSg9RiC8Dlf62Vw1+qLUuAAEhGPntH9hXUwX4k3DfSEComh79UP24HiApvZBIPDv/lI1Oz9yOqWBz+Un25EiCqvH8kLx9+AZhKhYSTRnJyFZPDX8qGJaD0TiEd/n/84ReAQzkS2HHYr1chOfylbFkCSm1nOof/gKDhF4CEk4f9WhWSw1+KYQkotWHP4uF9tVzKKMbwV2Cr4Z5YxeLwl+J5YWApzWNLXs84eob6wuGtAGzBUTj8tYLDX8oHVwJKaRsW0DqcFw6vAKScOKzXqXAc/lK+WAJK6YThvGjoXyHXsAHNzAU2H84JVRwOfym/3A4olS662I4pdA/lRUNfAWiiFYd/6Tn8pXxzJaBUxjCGtw/1RUMvAAnvGfJrVCgOf6kxWAJKJOG9Q3/JUMykmR6eB7Ye6olUDA5/qfG4HVAK82lhBybQO9gXDG0FoIcjcfiXlsNfakyuBJTC1vRy+FBeMLQCkPKuIX2+CsPhLzU2S0ApvHMonzzUawCOHuLnqwAc/lIxWAIKrlqvAtD/6N+xQw6khubwl4rFElBgCWO5lr0G++mDLwAVjh1WIDUsh79UTJaAAmsa/KwefAFILQBl4vCXis0SUFAJxwz+UwdjOltRZQ7QNNxMahwOf6k8fItg4fTQwrZMoGt9nzi4FYA+WnH4l4LDXyoXVwIKp4Ve3jGYTxxcAagM70lDaiwOf6mcLAEFkw5uZg+uAKRMGlEY5Z7DXyo3S0ChTB7MJ62/AHSwN7DzSNMovxz+ksASUCBvYDq7re+T1l8AXP4vNId/vD8t/FN0hFypUmXWklnRMUrLElAQVdrW9ynrLwCD3EtQ43H4x7t8zuV8Y/Y3omPkSwrvuOMdloBAloBCWO/sXncBuJQm4IhapVF+OPzjXT7nct533/voTQf98K7SeKH7BUtAMEtAw3s7U9c949ddAEazPzC6lokUz+Efb+Xw70l7oqPkliUgniWgoW3J4ey3rk9Y3xaAv/0XjMM/nsN/8CwB8SwBDSxd9wxfdwGoWACKxOEfz+E/dJaAeJaABjXsApCSkHJ4zQMphMM/nsN/+CwB8SwBDelI0rX/B1t7AZjOfsDW9UikbDn84zn8R84SEM8S0HC2ZdraHw+8rhWAw+oSR5ly+Mdz+NeOJSCeJaDBJGtfyV9XAXhrXcIoMw7/eA7/2rMExLMENJRD1/YHay8AFQ6pSxRlwuEfz+FfP5aAeJaAhjHEAjCTMaTsWbc4qiuHfzyHf/1ZAuJZAhrCvsxkzEB/MHAB6ONQ8L9oI3L4x3P4Z8cSEM8SkHsJfYwb6A/WVQDUYBz+8Rz+2bMExLME5NxaZvrABSDhLXUNo5pz+Mdz+MexBMSzBOTYWq7pG7gApBxY1zCqKYd/PId/PEtAPEtATqUcMNCHX1sArmMHEraveyDVhMM/nsM/PywB8SwBufR6prPdqz/42gJQGbgpKH8c/vEc/vljCYhnCcihKn/36g+9tgC4/N8QHP7xHP75ZQmIZwnIndf8cv/aApC4ApB3Dv94Dv/8swTEswTkyACzfaAVgNcsEyg/HP7xHP6NwxIQzxKQG/u/+gNrFoCr2JiEXTOLoyFx+Mdz+DceS0A8S0AOpOzOzWy0+ofWLAAbsO9rPqZccPjHc/g3LktAPEtAuCZeWvMW/2sO+4R9M42jQXH4x3P4Nz5LQDxLQLDKmjN+zQKQWgDyxuEfz+FfHJaAeJaAQMm6CgAWgDxx+Mdz+BePJSCeJSBIuu4C8MYMo2gdHP7xHP7FZQmIZwkIkKw541cVgGvYANgl6zx6LYd/PId/8VkC4lkCMpYyljtoWfmvqwpAC7sBTRGZtMro5tF0HtTp8A902ZzLOPm+kx3+JfBC9wu03dXGY0sfi45SWmfseAbf3eu70THKopn5q37RX1UAquweEkd/M6oyisvefBlv2dynMUe5fM7lnHLfKfSmvdFRlJFnX3mWt93+NlcCAp2181l8abcvRccoh+ZVs35VAagwNiSMAKgkFS7a7yJat2qNjlJaLvuXl9sB8c4eezYf3+nj0TGKr7pq1q8qAKkFINI3dv8GJ2x3QnSM0nLZX24HxPvuXt9l4pYTo2MUWzJwAXALIMjkrSbzmTd8JjpGabnsr5XcDojVlDRx8ZsuZvtR20dHKa50oC2AxBWACNuN2o6f7fczr4IN4rK/Xs3tgFj+TKy7VxWAlATYKSpNmf1gnx/YdoM4/LU2loBYk7eazAde/4HoGEW188r/018AprENsGFUmrKauOVE3r3tu6NjlJLDX+tjCYj19d2/zpjmMdEximgTrmNLWLUF4G//GWtJWjhv7/OiY5SSF/xpsLwwMM62o7bly2O/HB2jqHYCC0CY9+/wfvbZZJ/oGKXjBX8aKi8MjPOxnT7GThs6nmouWb0AVCwAWUpI+PQun46OUTou+2u43A6I0ZK08ImdPhEdo4h2hlUXAe4YGqVkjtnmGN64qc9dypLL/hoptwNinLnjmV4LUHtrbAG8LjBI6Zz5+jOjI5SKy/6qFbcDsrd58+actP1J0TGKJWEHWFUAtguMUipbtGxB21Zt0TFKw2V/1ZrbAdmzANTctrBqC8ACkJEp201hVGVUdIxScPirXiwB2XrbmLfx+g1eHx2jOJL+mb9yBWDbwCilcuzWx0ZHKAX3/FVvXhOQnUpS4ZhtjomOURzpygIwlQoJW0fnKYNKUmH8mPHRMQrPPX9lxWsCsnPEmCOiIxTJtqQkFQ5mK6A5Ok0ZvHnTN7Nly5bRMQrNZX9lze2AbBy5xZHREYqkhQ62qDCKbaKTlMXBow+OjlBoLvsritsB9bfjhjt6HUAtpWxTocoW0TnKYs+N94yOUFgu+yua2wH1t8fGe0RHKI4KYyokeIeFjPjFWx8u+ysv3A6oL3+G1lATW1SoWgCysutGu0ZHKByX/ZU3bgfUz9iNx0ZHKI4+xlSouAWQFW9nWVsu+yuv3A6oj9HNo6MjFEfCGFcAMrRp06bREQrDZX/lndsBtefP0BpK+lcANo/OURabNG0SHaEQXPZXo3A7oLY2a94sOkJxpP0rAFaqjLhUPXIu+6vRuB1QOz1VS38NbVIhYePoFGWxuG9xdISG5rK/GpXbAbXhz9AaSti4AmwUnaMs/OIdPoe/Gp0lYORe7ns5OkJxpGzkCkCG5nbPjY7QkNzzV1F4TcDI+DO0hlI2rpBaALLiN/3QueevovGagOF7dOmj0RGKI+kvAG4BZMQv3qFx2V9F5XbA8PgztKY2qpCwYXSKsnhg8QPRERqGy/4qOrcDhqY37eWRJY9ExyiSjSr4KODM3Nh1IylpdIzcc9lfZeF2wODd/fLdXkhdW80WgAzN6Z5jg10Pl/1VNm4HDM4NC2+IjlA0TRWgKTpFmcxcODM6Qm657K+ycjtg/a5fcH10hKJprpBaALJ02ZzLoiPkksv+Kju3A9auq7eL6QumR8comqYKiQUgS9cvvJ7nlj8XHSNXXPaX+rkdMLDfzPkNy6vLo2MUTbNbABmrplUufeHS6Bi54bK/tCa3A17r1y/8OjpCETVVohOU0XnPnOdSNy77S2vjdsAq9y2+jxkLZkTHKKQK0BcdomyeXPYkl8+5PDpGKJf9pXVzO6DfN2d/07dP10dfhdQCEOFbs79V2i9ql/2lwSn7dsDsZbPdMq2f3gqJBSDC3S/fzQV/vSA6RuZc9peGpszbAf/66L/6i0L99LkFEOizj36WRb2LomNkxmV/aXjKuB3wp4V/Kv1WaZ31VgB/FQsyp3sOX378y9ExMuGyvzQyZdoOWF5dzkcf+mhpt0kz0mcBCHbu0+dy9byro2PUlcv+Um08+8qzTLhzQuFLwOce/Rz3L74/OkbR9VZIeSU6RZmlpHzwwQ/y/PLno6PUhcv+Um0VvQRcO/9aznn63GHlZgAAG+BJREFUnOgYZbCsQsLS6BRlN7d7Lu+77310V7ujo9SUy/5SfRS1BDy29DFOu/80l/6zsbRCwrLoFOq/RfBpD5xGNa1GR6kJl/2l+ipaCZjXPY9j7j6G+T3zo6OUQ8qyCqkrAHlxyQuX8MlHPhkdY8T8zV/KRlFKwOK+xRx191E8stTHpWcmYWkFXAHIk3OfPpePP/Txhl0J+Plff8777nufv/lLGVl5n4C7X747OsqwLOhZwOS7JnPnS3dGRymXxBWAXPqfZ/6H4+89nleqjXV95jdnf5MPPPABh7+UsRe6X+CI249g2ovToqMMyexlsxl/+3hu6ropOkr5pCytUGFxdA691hVzr6DtrraGeHTwkr4l/MP9/8DnHv1cdBSptBb3Lead97yT8589PzrKoFy/8Hre+ue38vCSh6OjlNWSCild0Sk0sD8t/BN/d8vfcdW8q6KjrNUDix/g0D8fygXPl++2xlLeLK8u5yOzPsJ7/vIeFvYsjI4zoL60j7OfOJtJd07ihe4XouOU2UILQM692PMi77rnXZw560xe7HkxOs7fLK8u52tPfo1xt43zhh1Szlwx9woOvO3A3N1k7C8v/4Uj7ziSqY9PpS/1LvTBuipULAB5l5Lyo2d/xB437cG5T58b/o0zfcF0Drj1AL7w2Bca7joFqSxmL5vNcfccx6Q7J/HgkgdDsyzsWci/PPwvjLttnPv9eZHS5QpAA1nYs5B/fvif2fOmPTn36XNZVs3uDRwpKVfPu5rDbz+c1jtbS/VQEqmRzVgwg/1v2Z8p907hjpfuyPTcc7vncvYTZzP2prGc8/Q5XiCcJwkLEzoYT4KVrAFtP2p7ztzxTE7e/mT22mSvupzj+eXPc9mcyzj/2fPDf4soqrat2ug4sCM6Rm5U0ypN05uiYxRSQsJRWx/FB173AY7Z5hg2qmxU83NU0yo3LLyBi164iIufv5jl1eU1P4dqoMohCZ3sQ4o/2RvcAZsdwPHbHc+RWxzJWzZ/C6Mqo4Z1nGpa5b7F93HDwhu4ct6V3LDwhvAth6KzAKzJApCNzZo3413bvIvJW03myC2OZMcNdxz2sRb2LOTGrhuZvmA6l8+5nL8u/2sNk6ouKuyVMJOt6WFedBbVzsZNG/OWzd/CPpvsw+4b784eG+/BtqO2ZeOmjdm0aVMqVFhaXcqSviXM657Hk8ue5NGlj/Lwkoe57aXbcnv1cFFZANZkAYix60a7Mm7zceyx8R7svvHu7LLhLoxuHs3mzZvTkrRQpcrCnoUs7VvKc8uf49Glj/Lo0kf5y8t/4f4l9zfszctKq4UtElISOlkOtETnkcrIArAmC4BUd8tpZaMKCSng0xckSSqHuSSklRX/Mic0iiRJyspcAAuAJEnlMgdWFoDUAiBJUkmsVgASng+NIkmSsvICrCoAz4ZGkSRJWXkaVm0BPB0aRZIkZSPhGVi1AvBMaBhJkpSV1VYAmi0AkiSVQvPqKwATmA8sjcwjSZLqbjET+p8CXFntg14IKElSsf3tmr9VBSDliZAokiQpK4+v/D+rCkDCYyFRJElSNlab9asXgMcH/GRJklQM6UArAFVXACRJKrQBVwCwAEiSVGiVgQrAIp4A+iLySJKkuuuhwlMr/2VVAZhCNymzIxJJkqS6e5wJ9K78l8oaf5TwYOZxJElSFtaY8WsWgJQHMo0iSZKyssaMX7MAVJiVaRRJkpSVNWb8mgWg6gqAJEmFVFnXCkA3s4BqlnkkSVLd9dHEI6t/YM0CcBxLwWcCSJJUMI8ygVdW/0BlgE+6J6MwkiQpG3e/+gMDFYDXfJIkSWpg6WAKwACfJEmSGtprVvcHWgG4M4MgkiQpK32DKQDtzAWezyKPJEmqu2c5mnmv/uBAKwAAd9U5jCRJysaAW/trKwB/rmMQSZKUlYTbBvrw2grArXWMIkmSspIOPNMHLgAt/BnvCChJUqOr0svtA/3BwAVgAl3Aw/VMJEmS6u4Bjualgf5gbVsA4DaAJEmNbS3L/7DuAjDgRQOSJKlhrHWWr70AVLmxLlEkSVI2mvjT2v5o7QWgnQeBufXII0mS6izlBSat+Qjg1a29ACSkwE31yCRJkuos4Y/r+uN1XQOw3hdLkqTcGkEBgBtqGESSJGUlXfcMX3cBWMi9QFct80iSpLp7kVt4cF2fsO4CMIW+9TUISZKUOzOZuu47+q5vCwASOmsWR5Ik1V+6/tm9/gJQsQBIktRQmpi+vk9ZfwHofw/h7BrEkSRJ9fcYk3hifZ+0/gLQb8YIw0iSpCwMYvkfBlsABnkwSZIUbJDX7g2lAPSOJI8kSaq7HhL+MJhPHFwBmMwC4OaRJJIkSXWWcgOtLBrMpw72GgBIuXrYgSRJUv1V+P3gP3Xwn2kBkCQpz9J6FIBWZgGPDSePJEmqu4do49HBfvLgC0C/QTcLSZKUqSHN6KEVgCpXDunzJUlSNlJ+N5RPH1oBeIk/AnOH9BpJklRvc1jETUN5wdAKwBT6YGgNQ5Ik1VnKb1fM6EEb6jUA/SeRJEn5kfCbob5k6AVgK6YDC4f8OkmSVA8v0sINQ33R0AvAOHrw3QCSJOXF/zFh6LfrH3oBAEi5dFivkyRJtZVw2XBeNrwCsBXXAS8O67WSJKlW5tLMjOG8cHgFoH8b4PJhvVaSJNXKr4ez/A/DLQD9fjWC10qSpJFKhj+Lh18AWvkjMHvYr5ckSSPxBJO4bbgvHn4BSEjBiwElSQqR8qsVs3hYRrIFAFUuGNHrJUnS8FS4eGQvH4nJPADcMaJjSJKkobqZVmaN5AAjKwAAKT8b8TEkSdJQjHj2jrwA9C9BLBvxcSRJ0mAso2Xkb8UfeQFoZRFw5YiPI0mS1i/lMibQNdLDjLwA9HMbQJKkLKT8vBaHqU0BaKUTeKwmx5IkSWvzGO1cX4sD1aYA9L8P8cc1OZYkSVqbH4zkvf+rq9UWALTwE+CVmh1PkiSt7hUq/KJWB6tdAZjAfFJ+W7PjSZKkVVIuZVLtnsRbuwLQf7Qf1PR4kiSpXxM/rOXhalsAWrmRlHtrekxJknQPk7illgesbQEASPhOzY8pSVK5fbvWB6x9AdiSi4Fna35cSZLK6Tm6uKTWB619ARhHDynfr/lxJUkqp3OZQnetD1r7AgDQww+BxXU5tiRJZZHwMi38qB6Hrk8BOJaFwE/rcmxJksoi5X9rcd//gdSnAAD08R2gt27HlySp2Hpp4tx6Hbx+BeAoZgNX1O34kiQVWcqlTOSpeh2+fgWg/+j/VdfjS5JUVCnn1PPw9S0Ak7gduLGu55AkqWgSZjKZP9fzFPUtAAAp/133c0iSVCx1n531LwC38Dvg0bqfR5KkYpjFJK6p90nqXwCmUiXlm3U/jyRJxfB1EtJ6n6T+BQBgKy4AnsjkXJIkNa7HaOFXWZwomwIwjh7g65mcS5KkRpXwH0zI5h462RQAgC35BfBkZueTJKmRpDxOM7/M6nTZFYD+hwR9I7PzSZLUWDL77R+yLAAAi/g5MDvTc0qSlH+PMoqLszxhtgVgCt2kTM30nJIk5V3Kl7L87R+yLgAAi7gIeCDz80qSlE/3cQuXZn3S7AvAFPqAL2Z+XkmS8ulzTKWa9UmzLwAAbVxByi0h55YkKT9uoq3+d/0bSEwBAEhcBZAklVzK56NOHVcA2phBynVh55ckKdbvaOePUSePKwD9Z/8UZHvVoyRJOdBLhX+LDBBbAFqZRcJPQzNIkpS1lB8wiQcjI8QWAIAqXwReio4hSVJGuhjFV6JDxBeAduaS8K3oGJIkZSLhq0xgfnSM+AIAsAnfBp6KjiFJUl2lPE4P50XHgLwUgPEsI+Uz0TEkSaqzT3I0y6NDQF4KAEA7lwMd0TEkSaqTabRzVXSIlfJTAAASPgn0RMeQJKnGuunjrOgQq8tXAWhlFuRjb0SSpBr6b47i4egQq8tXAQDo5Wzg+egYkiTVyLO08LXoEK+WvwJwNC8B/xwdQ5Kkmkj5BBNYHB3j1fJXAADauIyE/4uOIUnSCF1Kez7nWT4LAEAfHwW6omNIkjRMi4BPRodYm/wWgMk8D7EPSpAkadhSPkUbf42OsTb5LQAArZwP/CE6hiRJQ3Q9bfwsOsS65LsAJKRU+CfglegokiQN0jKqfJiENDrIuuS7AABM4hFSvhodQ5KkQZrKZB6LDrE++S8AAKP4BnB3dAxJktbjL2zJd6JDDEZjFIAJ9FLhTKAvOookSWvRS8oHGdcYt7RvjAIAMInbSb1NsCQpt75NO3dGhxisxikAAN18gSRf91KWJAl4kE2ZGh1iKBqrABzHUvp4H9AdHUWSpBWWA6cwnmXRQYaisQoAwGTuIuHL0TEkSVrh87RxT3SIoWq8AgBwE9/CGwRJkuJ1cjPfjQ4xHI1ZAKZSpYnTgAXRUSRJpbWQlA8ylWp0kOFozAIAMJHnSPhwdAxJUmmdSTvPRIcYrsYtAACt/Bb4eXQMSVLpnE8bl0WHGInGLgAAKR8HHomOIUkqjcdo4TPRIUaq8QtAO0uAU6Ax7rwkSWpoPVQ5hQksjg4yUo1fAADauAP4z+gYkqTC+yKT+XN0iFooRgEA6OKrpEyPjiFJKqxruZn/ig5RK8UpAFPoI+VE4MnoKJKkwnmKFk5r1Lf8DaQ4BQBgMguA90Bj3Y5RkpRrr5DyXiYwPzpILRWrAAArbsd4ZnQMSVJBJHy0kZ7yN1jFKwAAbVxIwo+iY0iSGt73aOVn0SHqoZgFAGALPg7cFB1DktSwbqWLT0eHqJfiFoBx9JByMjA3OookqeHMoYnjmVLcx88XtwAAtPMMVU4CeqOjSJIaRi9wIhN5LjpIPRW7AABMZiYpn4+OIUlqGJ+hjRuiQ9Rb8QsAQBv/Dxr7oQ2SpEz8ijbOiQ6RhXIUgISUTfkHUm6JjiK9Wne1sFuMw7I8XR4dQeV1O8v5UHSIrJSjAACMZxmjeCfwWHQUaXUv970cHSFXXu7170MhniTlWI5jaXSQrJSnAABMYD4pxwELo6NIKznw1vRS70vREVQ+C+jjKNrL9a6xchUAgHYeIuXvAdcZlQsLe+2jq+vq7YqOoHLppsrxHMXD0UGyVr4CANDOH0k5HUijo0jzuuc59Fbz6NJHoyOoPFLgg0xmZnSQCOUsAADt/JqEs6NjSACPLHkkOkJuPLykdL+IKUrKF2jjougYUcpbAAAm8RXg59ExpIeWPhQdITf8u1AmEn5KO1+PjhGp3AUgIWVLziBlenQUldutXbdGR8gN/y5UdwkzWcg/RceIVu4CAP3PDOjjvcB90VFUXjMXlnIL8jUeW/oYT73yVHQMFdsDNPOeIt/jf7AsAABH8xIpxwCzo6OonB5a8hDPLS/0bccHZcaCGdERVGxP0EQ7E/CqWywAq7TzDE1MAv4aHUXldNW8q6IjhLt6/tXREVRcz5EyqegP+BkKC8DqJvI4FSYAc6KjqHwufP7C6Aih5nbPpWN+R3QMFdM8Elpp58noIHliAXi1STxClXZgQXQUlcvNXTeX+i1wv3zhl/SkPdExVDyLqDKZVmZFB8kbC8BAJvMXEo4hwXu0KlP/+9z/RkcIUU2r/Pi5H0fHUPEsIeFYJnNXdJA8sgCsTSu3UuXvgWXRUVQeP3z2h8zvmR8dI3P/N+//eGDxA9ExVCzLSDiWVm6MDpJXFoB1aecP4HMDlJ0lfUs47+nzomNk7utPlvp+LKq9bhJOoJXro4PkmQVgfdqYBpwM9EZHUTmc8/Q5vND9QnSMzFw+53LueOmO6Bgqjj4STqWV30cHyTsLwGC0cQUJHwSq0VFUfIt6F/Gvj/xrdIxMLO1bymce+Ux0DBVHFTidVi6NDtIILACD1coFJJyKKwHKwIXPX8gfFvwhOkbdffnxL3vnP9VKH/DBMj/cZ6iS6AANZxrvBC4FNoiOomIbu9FY7jz0TkY3j46OUhe3LrqVI24/wrf+qRa6SXgfrfwmOkgjcQVgqNr4HSnvxncHqM4eX/Y4H3rwQ9Ex6mJBzwJOuvckh79qYSkV3uXwH7qm6AAN6SIe4/38iQrH40qA6ujBJQ+yZcuWHDL6kOgoNdOX9nHCvSd44Z9qYQnwLlrpjA7SiFwBGK52/kjKO4AXo6Oo2D71yKe4fM7l0TFq5pMPf5Jr518bHUONr4sKrbThE6SGyQIwEm3cQUIrMC86ioqrL+3jlPtPofPFxv8l58uPf5nzninffQ5Uc3Op8nYmcUt0kEZmARipVu4m5QjwCVOqn+5qN8ffe3xDvzPgK098ha888ZXoGGp8z1PlHUzmL9FBGp3vAqiVa3kDFaaTMDY6ioprVGUUF7zxAk7c/sToKIOWkvLpRz7Nd576TnQUNb7ZNDGJiTweHaQIvAiwVi6mi1O5goQ2YNvoOCqmvrSP3877LRtWNuSwMYeR5LzDd/V2cdK9J/GLv/4iOooaXcq9NDORiXjjiBrJ90+PRnQlm7ERlwBHRUdRsU3cciIXv+lithu1XXSUAd350p2ceO+JPL7MX9Y0QinTqXA8rSyKjlIkXgNQa+/iZVp4J3B+dBQV24wFMzjo1oO4Yu4V0VHW8Er1Fb7yxFcYf/t4h79q4WdsxdEO/9pzBaCepvHPwHfw71l19o4t38H39/4+e22yV2iOmQtm8rGHPsasJbNCc6gQUlK+QjtTo4MUlYOp3qZxAnABsGF0FBXbqMooTtruJL6w2xfYc+M9Mz33TV038c3Z3+SqeVdlel4V1nJSPkg7F0cHKTILQBY6GE/ClcDW0VFUfM1JMydufyIfev2HOGLMEVSS+uz0Le1bym/n/pYfPPsDbu66uS7nUCktAN5DGzdEByk6C0BWrmN3KlwD7BEdReWxy4a7cMoOp3DU1kdxyOhDaElaRnS8rt4ublh4A1fMvYLfzv0tL/e+XKOkEgBPkHIM7TwUHaQMLABZms5WVLkSOCw6ispn06ZNedsWb2Pc5uPYe5O92Wvjvdhlo13YuuW1C1M9aQ/zu+fz8NKHeWTJIzy09CFuXHgjd718F31pX0B6lcBtpLyTduZGBykLC0DWrmJjNuDnwAnRUaSVNm3alE2bNqUn7WFx32KWV5dHR1K5/IpN+SDjfcpqliwAUTo4g4TvASNbk5WkxtUL/DttfDM6SBlZACJ1cARwCQnbR0eRpIzNA072aX5xLADRZvB6+rgcODQ6iiRl5A4S3ksrT0cHKTPvBBhtIs/Ry9uBc6OjSFLdJfyILg5z+MdzBSBPpvF++m8hvHF0FEmqsVdI+Rjt/DQ6iPpZAPKmkwNI+Q2wa3QUSaqRp6lwPJO4PTqIVnELIG9auZsKbwGmRUeRpBq4lioHOPzzxwKQR5N4kS6OBr4A9ETHkaRh6AY+x80cy2QWRIfRa7kFkHfTeQtVLgKyfbqLJA1XwsNUOYV27oyOorVzBSDvJnE7m7I/vktAUmO4kGbGOfzzzxWARtLJe0j5EbBVdBRJepUuUj5CO5dEB9HgWAAazUy2p4efAkdFR5GkFWbQxD8wkeeig2jw3AJoNBN4gVaOAf4F8IktkiL1kHI2N9Pm8G88rgA0sg72I+GXwJuio0gqnVkknEIrd0cH0fC4AtDI2rmf5RwKfBvwIe2SstBLwn+xKQc5/BubKwBFMY39gf8FxkVHkVRQKffSxIe8qU8xuAJQFG3cQwtvpf/agCXRcSQVyjJSzmYRb3H4F4crAEU0g7H0cT4wMTqKpAaX8Cd6+TBH8XB0FNWWBaCoUhKmcyop38b7Bkgaui5SPksb/0tCGh1GtWcBKLr++wZ8Czg1OoqkBpFwNRU+4lv7is0CUBbTeDfwPeB10VEk5dazwMdo43fRQVR/XgRYFm1cQcqepJyNNxCStKYe4FyWsa/DvzxcASijaewBfBc4OjqKpHAzqHAWk3gwOoiyZQEosw6OI+EcYNfoKJIylvI4Cf9GG5dFR1EMtwDKrJ2r6GJv+u8dsCg6jqRMLCblbEaxn8O/3FwBUL/pbEWVLwEfBZqj40iquV4SfkqVL9LO3OgwimcB0JquZS+a+A/ghOgokmokZTrwSdq5PzqK8sMCoIF1MJ6ErwNHREeRNGy3UuXzTGZmdBDljwVA6zadSVT5FnBAdBRJg/YAcLZ7/FoXLwLUuk1iOjczjv47CT4RHUfSOj0KvI+bebPDX+vjCoAG7w5aWMjJpPw7sEd0HEl/M5uUrzOKnzKB3ugwagwWAA3dVCqM573AfwJ7RseRSuxJUr7h4NdwWAA0fDNppptTSPg8FgEpS7OAr9PFL5lCX3QYNSYLgEZuKhXeyjErisCh0XGkArsJOIcufuvg10hZAFRbnRwOfJaUY/DrS6qFKgnXAF+llVujw6g4/AGt+ujkAFI+CZwIjIqOIzWchJeBH1PhHCbyVHQcFY8FQPU1ne2ocjpwFvC64DRSI5hDyg9JOZfJLIgOo+KyACgbM9mQbk4BziLhzdFxpBy6h4TvsJBfM4Xu6DAqPguAstfBQVQ4g5T3AxtHx5ECLQd+R4UfMYnp0WFULhYAxZnJGLqZQsJZwBuj40gZehT4CS38hAnMjw6jcrIAKF5KQifvAE4H3gtsFBtIqoulwG+o8jPauZ6ENDqQys0CoHy5hs1p4e+pcioJE/FrVI3vTuBCqlzoRX3KE3+4Kr+msy99nErCycAu0XGkIXgS+BUpF9LOQ9FhpIFYANQYOjiIhNPov6/AdtFxpAEsAH5PhQuYyAyX+JV3FgA1lpk000MbcALwTmDL4EQqtxdJuBK4lGZm+EAeNRILgBrXpTSxBW8l5QT6C8EO0ZFUCi8C15ByGVtxHePoiQ4kDYcFQMXQXwbeBryTlGOBPaIjqVAeAa4m5UoWcZMP4lERWABUTNPZjT4mUeE4UtrweQQamj7gVuAqKlzFJB6MDiTVmgVAxTeTMfQykZRWoBXYLTqScijlcWAaCZ0k/IFWFkVHkurJAqDymcFY+v5WBt6OFxKW1YvATGA6FTqZxBPRgaQsWQCkldsFCYfTXwh2Ck6k+phLwp9JuZGU6dzC3UylGh1KimIBkF6tk31IOYyEt5JyCLAPUImOpSGpAg8Ct5FyC1Vu5Cgejg4l5YkFQFqfa9icURxMH4dS4RBSDgBeHx1La3gWuJuUP5NwC73cztG8FB1KyjMLgDQcHWxLwv7AASQcsKIUjAWagpMVXR8Jj5FyN3APKXfRxz0czbzoYFKjsQBItTKTDelhb/q3DPYD9l7xz92A5shoDaiHhCdIeYCUWcD9pMyiykMczfLocFIRWACkeruDFuazC83sTpWxpOxOhd1J2Y3+hxxtEh0xyBLgKeDxFb/V9/+zwmNUeMrb6kr1ZQGQol3HljSzI33sDOwM7ETCDsA2JGxPynbANjTOzYy6gXkkzCHlBWAe8FdSngWepomneYVnOJaFsTGlcrMASI3iOrYkZRsqjKHCGKqMIWELEsaQMgYYTUoTCWNIaKHKpiRsBGy44gjNwGbrOcvL8LffvF8hZRkVFpPSQ0oX0EvCS8BCoIuULip0UV3xvz7mOtilxvD/AdNdiuyj84QBAAAAAElFTkSuQmCC"
                      alt="Send Message"
                      style={{
                        filter:
                          !isReady || isGenerating
                            ? "grayscale(100%)"
                            : undefined,
                      }}
                      width="40"
                      height="40"
                    />
                  </Button>
                  
                  <FileLoader setFileText={setFileText} />
                  <Button onClick={handleClearChat}>Clear Chat</Button>
                  </div>
                  
                  <div
                    className="w-full h-1 mt-2"
                    style={{
                      backgroundColor:
                        !isReady || isGenerating ? "yellow" : "green",
                      width: "100%",
                      height: "5px",
                      marginTop: "2px",
                    }}
                  ></div>
                
              </div>
            </div>
          )}
          {!isReady && <Loader />}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;