import React, { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { db } from "../../../firebase";
import "../styles/Reviews.scss";

export default function Reviews({ habitatId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!habitatId) return;
      const reviewsCollection = collection(db, `habitats/${habitatId}/reviews`);
      const reviewsQuery = query(reviewsCollection, orderBy("timestamp", "desc"));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsList = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsList);
    };

    fetchReviews();
  }, [habitatId]);

  return (
    <div className="reviews-container">
      {reviews.map(review => (
        <div key={review.id} className="review-card">
          <div className="review-question">{review.question}</div>
          <div className="review-response">{review.responses.join(", ")}</div>
          <div className="review-rating">
            {review.ratings === "Like" ? <FaThumbsUp /> : <FaThumbsDown />}
          </div>
          <div className="review-timestamp">{new Date(review.timestamp?.toDate()).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
