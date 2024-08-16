
const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);
const  viem =require("viem")

// Recursive JavaScript function to generate a Fibonacci series up to the nth term.
const fibonacci_generated=[];
  const fibonacci_series =(n)=>{

  if (n <= 1) {
    return [0, 1];
  } else {
 
    const s = fibonacci_series(n - 1);
     s.push(s[s.length - 1] + s[s.length - 2]);
    return s.slice(0, n);
  }
};
console.log(fibonacci_series(8));
 
async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  let JSONpayload={};
  try{
    const payloadstr =viem.hexToString(data.payload);
    JSONpayload = JSON.parse(payloadstr);
  } catch (e){
    console.log(`adding a report with the binary payload ${data.payload}`);
    await fetch (rollup_server +"/report",{
      method: "POST",
      headers:{
        "Content-Type":"application/json",
      },
      body :JSON.stringify({payload : data.payload}),
    });
  }
let url =string(rollup_server+"/report");
let hexresult;
try {
  if(JSONpayload.method==="S"){
    const s=fibonacci_series(parseInt(JSONpayload.args.n));
    fibonacci_generated.concat(...s);
    console.log("fibonacci sequence are:", s)
    url=string(rollup_server+"/notice")
    hexresult=viem.stringToHex(JSON.stringify({s:s}));
    hexresult=viem.stringToHex(
      JSON.stringify({error: "method undefined"})
    );
  }
  else{
    console.log("method undefined")
  }
} catch (e) {
  console.log("error:",e);
  hexresult=viem.stringToHex(JSON.stringify({Error: e}));
  
}
await fetch (url,{
  method: "POST",
  headers:{
    "Content-Type":"application/json",
  },
  body :JSON.stringify({payload :hexresult}),
});


  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  try {
    const payloadstr =viem.hexToString(data.payload);
    if (payloadstr==="s"){
      hexresult = viem.stringToHex(JSON.stringify({s:fibonacci_generated}))
    }   
    else{
      hexresult = viem.stringToHex("this a cartesi Dapp to generate Fibonacci sequnce within a given range of numbers");
    } 
  } catch (error) {
    console.log("Error : ", e)
    hexresult=viem.stringToHex(JSON.stringify({error:e}));
  }
  await fetch (rollup_server+"/report",{
    method: "POST",
    headers:{
      "Content-Type":"application/json",
    },
    body :JSON.stringify({payload :hexresult}),
  });
  
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
