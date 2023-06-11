import useLLM from "@react-llm/headless";

const Loader = () => {
  const { loadingStatus, isReady, init, gpuDevice } = useLLM();
  if (isReady) return null;
  if (loadingStatus.progress === 1) return null;

  if (gpuDevice.unsupportedReason) {
    return (
      <div style={{ fontSize: "20px" }}>
        <p style={{ color: "red" }}>Sorry, unsupported!</p>
        <p> Reason: {gpuDevice.unsupportedReason}</p>
        <p>
          This project runs models in
          the browser with WebGPU and only works in Google Chrome v113 and above
          on Desktop with supported GPUs. Experimental support may be available for desktop Firefox and Safari Tech Preview.
        </p>
      </div>
    );
  }

  if (loadingStatus.progress == 0) {
    return (
      <div style={{ padding: "10px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "left",
            flexDirection: "column",
            gap: "10px",
            fontSize: "24px",
            textAlign: "left",
            fontFamily: "Arial"
          }}
        >
          <div>
          <h1 className="p-1">
              <b>web-llm-embed</b>
            </h1>
          <div>
          💎 Edge based document chat. No data is sent to the server. Model is Vicuna 7b trained by LMSys.
          </div> 
          </div>
          <div>
          📄 This will download the model (~4GB) and may take a few minutes. After the
            first time, it will be cached.
          </div> 

          <button
            style={{ padding: "10px" }}
            size="lg"
            onClick={() => init()}
          >
            Load Model
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", margin: "10px" }}>
      Loading {loadingStatus.progress * 100}%
    </div>
  );
};

export default Loader;