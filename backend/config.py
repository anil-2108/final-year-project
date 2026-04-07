import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = "C:/Users/anilc/Downloads/archive (1)/Student Dataset/Student-engagement-dataset/Engaged"
MODEL_PATH = os.path.join(BASE_DIR, "model", "face_model_resnet50.h5")
IMG_SIZE = (224,224)
BATCH_SIZE = 16
EPOCHS = 8

