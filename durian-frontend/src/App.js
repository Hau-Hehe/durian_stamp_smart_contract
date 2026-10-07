import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";

const CONTRACT_ABI = [
  "function createStamp(string memory _stampId, string memory _batchNo, string memory _productName, string memory _farmName, uint256 _harvestDate, string memory _ipfsHash) public",
  "function getStampDetails(string memory stampId) external view returns (string memory batchId, string memory productName, string memory farmLocation, uint256 harvestDate, string memory metadataHash, uint8 currentStage, bool isAuthentic)",
];
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");

  const [formData, setFormData] = useState({
    stampId: "DURIAN-2026-001",
    batchNo: "BATCH-01",
    productName: "Sầu Riêng Ri6 Miền Tây",
    farmName: "Nông trại Đăk Lăk",
    ipfsHash: "QmHashTest",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [createdStampId, setCreatedStampId] = useState("");

  const [scannedData, setScannedData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stampParam = params.get("stamp");
    if (stampParam) {
      fetchStampDetailsFromBlockchain(stampParam);
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await web3Provider.getSigner();
        const userAddress = await signer.getAddress();

        setProvider(web3Provider);
        setAccount(userAddress);
        setMessage({ type: "success", text: "Kết nối ví thành công!" });
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Từ chối kết nối ví." });
      }
    } else {
      alert("Vui lòng cài đặt MetaMask!");
    }
  };

  const handleCreateStamp = async (e) => {
    e.preventDefault();
    if (!provider || !account) {
      alert("Vui lòng kết nối ví MetaMask trước!");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      setCreatedStampId("");

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );
      const harvestTimestamp = Math.floor(Date.now() / 1000);

      const tx = await contract.createStamp(
        formData.stampId,
        formData.batchNo,
        formData.productName,
        formData.farmName,
        harvestTimestamp,
        formData.ipfsHash,
      );

      setMessage({
        type: "info",
        text: "Đang gửi giao dịch lên blockchain...",
      });
      await tx.wait();

      setMessage({
        type: "success",
        text: `Tạo tem ${formData.stampId} thành công!`,
      });
      setCreatedStampId(formData.stampId);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: `Lỗi: ${error.reason || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStampDetailsFromBlockchain = async (stampId) => {
    try {
      setLookupLoading(true);
      // Dùng Provider công khai đọc dữ liệu không cần ví
      const rpcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        rpcProvider,
      );

      const data = await contract.getStampDetails(stampId);

      setScannedData({
        stampId: stampId,
        batchId: data[0],
        productName: data[1],
        farmLocation: data[2],
        harvestDate: new Date(Number(data[3]) * 1000).toLocaleString(),
        metadataHash: data[4],
        currentStage: Number(data[5]),
        isAuthentic: data[6],
      });
    } catch (error) {
      console.error(error);
      setScannedData({
        error:
          "Không tìm thấy thông tin tem hoặc tem không tồn tại trên hệ thống!",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  if (window.location.search.includes("stamp=")) {
    return (
      <div
        style={{
          background: "#111",
          minHeight: "100vh",
          padding: "24px",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            background: "#1a1a1a",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #333",
          }}
        >
          <h2
            style={{
              color: "#4ade80",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Tra Cứu Nguồn Gốc Sầu Riêng
          </h2>

          {lookupLoading && (
            <p style={{ textAlign: "center" }}>
              Đang tải dữ liệu bất biến từ Blockchain...
            </p>
          )}

          {scannedData?.error && (
            <div
              style={{
                background: "#ef444422",
                border: "1px solid #ef4444",
                padding: "12px",
                borderRadius: "8px",
                color: "#f87171",
                textAlign: "center",
              }}
            >
              {scannedData.error}
            </div>
          )}

          {scannedData && !scannedData.error && (
            <div style={{ display: "grid", gap: "12px" }}>
              <div
                style={{
                  background: scannedData.isAuthentic
                    ? "#22c55e22"
                    : "#ef444422",
                  border: `1px solid ${scannedData.isAuthentic ? "#22c55e" : "#ef4444"}`,
                  padding: "12px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: scannedData.isAuthentic ? "#4ade80" : "#f87171",
                  }}
                >
                  {scannedData.isAuthentic
                    ? "SẢN PHẨM CHÍNH HÃNG"
                    : "CẢNH BÁO: HÀNG GIẢ / BỊ BÁO CÁO"}
                </span>
              </div>

              <p>
                <b>Mã Tem:</b> {scannedData.stampId}
              </p>
              <p>
                <b>Tên Sản Phẩm:</b> {scannedData.productName}
              </p>
              <p>
                <b>Số Lô:</b> {scannedData.batchId}
              </p>
              <p>
                <b>Nông Trại / Địa Điểm:</b> {scannedData.farmLocation}
              </p>
              <p>
                <b>Ngày Thu Hoạch:</b> {scannedData.harvestDate}
              </p>
              <p>
                <b>Giai Đoạn Hiện Tại:</b> Giai đoạn số{" "}
                {scannedData.currentStage} (Đã thu hoạch)
              </p>
              <p>
                <b>Mã Hash Hồ Sơ (IPFS):</b> {scannedData.metadataHash}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "24px",
        borderRadius: "8px",
        color: "#fff",
        maxWidth: "600px",
        margin: "20px auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ color: "#4ade80", margin: 0 }}>
          Tạo / Đăng Ký Mã Tem Mới
        </h3>
        {account ? (
          <div
            style={{
              background: "#22c55e22",
              border: "1px solid #22c55e",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#4ade80",
            }}
          >
            🟢 {account.substring(0, 6)}...
            {account.substring(account.length - 4)}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            style={{
              background: "#f59e0b",
              color: "#000",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🦊 Kết Nối Ví MetaMask
          </button>
        )}
      </div>

      <form
        onSubmit={handleCreateStamp}
        style={{ display: "grid", gap: "12px" }}
      >
        <div>
          <label
            style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
          >
            Mã Tem (Stamp ID):
          </label>
          <input
            type="text"
            value={formData.stampId}
            onChange={(e) =>
              setFormData({ ...formData, stampId: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "#2a2a2a",
              border: "1px solid #444",
              color: "#fff",
              borderRadius: "4px",
            }}
            required
          />
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
          >
            Số Lô (Batch No):
          </label>
          <input
            type="text"
            value={formData.batchNo}
            onChange={(e) =>
              setFormData({ ...formData, batchNo: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "#2a2a2a",
              border: "1px solid #444",
              color: "#fff",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
          >
            Tên Sản Phẩm:
          </label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) =>
              setFormData({ ...formData, productName: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "#2a2a2a",
              border: "1px solid #444",
              color: "#fff",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
          >
            Tên Nông Trại:
          </label>
          <input
            type="text"
            value={formData.farmName}
            onChange={(e) =>
              setFormData({ ...formData, farmName: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "#2a2a2a",
              border: "1px solid #444",
              color: "#fff",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#555" : "#16a34a",
            color: "#fff",
            padding: "10px 16px",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
          }}
        >
          {loading ? "Đang xử lý trên chuỗi..." : "Tạo Tem Lên Smart Contract"}
        </button>
      </form>

      {message.text && (
        <p
          style={{
            marginTop: "12px",
            color: message.type === "error" ? "#f87171" : "#4ade80",
            fontWeight: "500",
          }}
        >
          {message.text}
        </p>
      )}

      {createdStampId && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            padding: "16px",
            background: "#222",
            border: "1px solid #4ade80",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ color: "#4ade80", marginBottom: "8px" }}>
            Mã QR Truy Xuất Nguồn Gốc Sầu Riêng
          </h4>
          <p style={{ fontSize: "13px", color: "#ccc", marginBottom: "12px" }}>
            Quét mã này bằng điện thoại để xem chi tiết thông tin từ Blockchain:
          </p>

          <div
            style={{
              background: "#fff",
              padding: "12px",
              display: "inline-block",
              borderRadius: "6px",
            }}
          >
            <QRCodeSVG
              value={`${window.location.origin}/?stamp=${createdStampId}`}
              size={160}
              level={"H"}
              includeMargin={true}
            />
          </div>

          <p style={{ marginTop: "10px", fontSize: "12px", color: "#aaa" }}>
            Đường dẫn QR: {window.location.origin}/?stamp={createdStampId}
          </p>
        </div>
      )}
    </div>
  );
}
