const sendImage = async (blob) => {
  const formData = new FormData();
  formData.append("image", blob);

  const res = await fetch("http://localhost:5000/predict", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  console.log(data);
};