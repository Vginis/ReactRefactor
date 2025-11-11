import React,{useState,useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import "../styling/Deposit.css";
import {makeADeposit} from '../util/functionality.js';
function Deposit({
  currentUser,
  token,
  accounts,
  num
}){
    const [sourceAccount,setSourceAccount] = useState(null);
    const [amount,setAmount] = useState(0);
    const navigate = useNavigate();
    
    useEffect(() => {
    const fetchData = async () => {
        try {
            const userResponse = await fetch(Endpoints.USER+`/name/${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!userResponse.ok) {
                throw new Error('Bank API response was not ok');
            }
            const userData = await userResponse.json()
            const extractedAccounts = userData.accountList.map(element => element);
            setAccounts(extractedAccounts);
            setUser(userData);
        } catch (error) {
            setError(error);
            console.error('There was a problem with the fetch operation:', error);
        }
    };
    fetchData();
}, [username,token]);
    async function makeDeposit(){
        await makeADeposit(sourceAccount,amount,token);

        setAmount(0);
        setSourceAccount(0);
    }

    return (
      (<div className='deposits'>
        <h1>Deposit Amount from an Account</h1>
        <label htmlFor="sourceAccount">Select Account: <span className="required">*</span></label>
        <select
        id="sourceAccount"
        name="sourceAccount"
        value={sourceAccount}
        onChange={(e) => setSourceAccount(e.target.value)}
        required>
        <option value="sourceAccount">Select from your accounts...</option>
        {accounts.map((account) => (
            <option key={account} value={account}>
                Account ID: {account}
            </option>
        ))}
</select><br></br>
        <label htmlFor="amount">Select Amount: <span className="required">*</span></label>
        <input className="amount" type="number" id="amount" name="amount" placeholder="Enter the amount you want to send" required
        value={amount} onChange={(e) => setAmount(e.target.value)}></input><br></br>
        <Example num={num}/>
        <button className='deposit-button' onClick={makeDeposit}>Deposit</button>
        <button className='back-button' onClick={() => navigate('/ui')}>Back to Home Page</button>
      </div>)
    );
}

function Example({num:num}){
  return(<>
    <div>Example Component{num}</div>
    </>
  )
}
export default Deposit;