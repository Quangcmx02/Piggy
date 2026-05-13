import { useState } from "react";

import { walletApi } from "./api/wallet.api";
import { categoryApi } from "./api/category.api";
import { transactionApi } from "./api/transaction.api";
import { userApi } from "./api/user.api";
import { useAuth } from "./contexts/AuthContext";
export default function ApiTester() {
  console.log("Kiểm tra ENV:", import.meta.env.VITE_BASE_API_URL);
  const [log, setLog] = useState<any>(null);
  const { login } = useAuth();
  const testLogin = async () => {
    try {
      const res = await login("a", "a");
      setLog(res);
    } catch (err: any) {
      setLog({ error: err.message, res: err.response?.data });
    }
  };

  const testGetMe = async () => {
    try {
      const res = await userApi.getMe();
      setLog(res);
    } catch (err: any) {
      setLog({ error: err.message, res: err.response?.data });
    }
  };

  const testWallets = async () => {
    try {
      const res = await walletApi.getMyWallets();
      setLog(res);
    } catch (err: any) {
      setLog({ error: err.message, res: err.response?.data });
    }
  };

  const testCategories = async () => {
    try {
      const res = await categoryApi.getMyCategories();
      setLog(res);
    } catch (err: any) {
      setLog({ error: err.message, res: err.response?.data });
    }
  };

  const testTransactions = async () => {
    try {
      const res = await transactionApi.getMyTransactions();
      setLog(res);
    } catch (err: any) {
      setLog({ error: err.message, res: err.response?.data });
    }
  };

  const clearLog = () => setLog(null);

  return (
    <div style={{ padding: "20px", border: "2px solid #646cff", borderRadius: 8, marginTop: "2rem", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
      <h2>API Tester</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", justifyContent: "center" }}>
        <button onClick={testLogin}>Log cIn</button>
        <button onClick={testGetMe}>Get My Profile</button>
        <button onClick={testWallets}>Get My Wallets</button>
        <button onClick={testCategories}>Get My Categories</button>
        <button onClick={testTransactions}>Get Mxy Transactions</button>
        <button onClick={clearLog} style={{ background: "#ff4646" }}>Clear</button>
      </div>
      <div style={{ background: "#1a1a1a", padding: "15px", borderRadius: "5px", textAlign: "left", minHeight: "200px", overflow: "auto" }}>
        {log ? (
          <pre style={{ margin: 0, color: "#fff" }}>{JSON.stringify(log, null, 2)}</pre>
        ) : (
          <span style={{ color: "gray" }}>Click a button to see API response here...</span>
        )}
      </div>
    </div>
  );
}
