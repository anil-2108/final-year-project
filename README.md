# 🎓 VISION-BASED DEEP LEARNING FOR ENGAGEMENT DETECTION AND STUDENT ATTENDANCE

## 📌 Project Description

This project is an AI-powered system designed to automate student attendance and monitor engagement levels in a classroom environment. It uses Computer Vision and Deep Learning techniques to detect faces, recognize students, and classify engagement levels such as Focused, Bored, or Frustrated.

The system consists of:

* **Backend (Python)**: Handles face detection, recognition, and model processing.
* **Frontend (React + Vite)**: Provides user interface for live attendance and dashboard.
* **Database (Supabase)**: Stores attendance records and student data.

---

## ⚙️ Features

* Face Detection & Recognition
* Automatic Attendance Marking
* Engagement Detection (Focused, Bored, etc.)
* Real-time Monitoring Dashboard
* Student Registration System

---

## 🚀 How to Run the Project

### 🔹 1. Clone Repository

```bash
git clone https://github.com/anil-2108/final-year-project.git
cd final-year-project
```

---

### 🔹 2. Run Backend (Python)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

### 🔹 3. Run Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

### 🔹 4. Environment Setup (Important)

Create a `.env` file inside **frontend/** and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

---

## 📂 Dataset & Model Download

Due to GitHub size limitations, dataset and trained models are not included in this repository.

👉 Download here:

* Dataset: [https://drive.google.com/your-dataset-link](https://drive.google.com/your-dataset-link)
* Trained Model (.h5): [https://drive.google.com/your-model-link](https://drive.google.com/your-model-link)

After downloading:

* Place dataset in project root
* Place model file inside `backend/model/`

---

## 🧠 Technologies Used

* Python
* TensorFlow / Keras
* OpenCV
* React (Vite)
* Supabase

---

## 📊 Output

* Real-time attendance tracking
* Engagement classification results
* Dashboard visualization

---

## ⚠️ Note

Large files such as datasets and trained models are excluded from this repository. Please download them using the links above.

---

## 👨‍💻 Author

Anil,
Vijay

---

## ⭐ Acknowledgment

This project was developed as part of a final year academic project.
