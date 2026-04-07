from tensorflow.keras.preprocessing.image import ImageDataGenerator
from config import DATASET_PATH, IMG_SIZE, BATCH_SIZE

def get_data_generators():
    datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)
    train = datagen.flow_from_directory(DATASET_PATH, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', subset='training')
    val = datagen.flow_from_directory(DATASET_PATH, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', subset='validation')
    return train, val
