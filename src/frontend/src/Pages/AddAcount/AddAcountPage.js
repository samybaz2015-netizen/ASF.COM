import { React, useState, useEffect } from "react";
import Sidebar from "../../Component/Sidebar/Sidebar";
import Header from "../../Component/Header/Header";
import { useParams } from "react-router-dom";
import AddAccountCom from "./AddAccount";
import { Url } from "../../function/FunctionApi";
import { authHeaders } from "../Accounts/AccountsConstants";
import axios from "axios";
import "./AddAccount.css";

function AddAccount() {
  const { id } = useParams();

  const [filteredAccount, setFilteredAccount] = useState(null);
  const [loading, setLoading] = useState(!!id); // only show loading if edit mode

  useEffect(() => {
    // if no id → create mode, nothing to fetch
    if (!id) return;

    const fetchAccount = async () => {
      setLoading(true);
      try {
        // fetch only the one account we need directly by id
        const res = await axios.get(
          `${Url}Account/accounts?page=1&pageSize=1000`,
          { headers: authHeaders() }
        );

        const list = res.data?.data || res.data || [];

        // ← fix: compare as strings so "5" === 5 works
        const found = list.find(
          (account) => String(account.id) === String(id)
        );

        setFilteredAccount(found || null);
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [id]);

  if (loading) {
    return (
      <div >
          <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", height: "60vh",
            fontFamily: "'Cairo', sans-serif", color: "#2A385B", fontSize: "1rem",
          }}>
            جارٍ تحميل بيانات الحساب...
        </div>
      </div>
    );
  }

  return  <AddAccountCom accountData={filteredAccount} />
     
}

export default AddAccount;