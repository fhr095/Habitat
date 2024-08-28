try {
    const feedbackRef = doc(collection(db, `habitats/${habitatId}/feedback`));
    await setDoc(feedbackRef, feedbackData);
} catch (error) {
    console.error("Erro ao enviar feedback: ", error);
}