/**
 * Example React Component (Web)
 * Run: npx test-gen-js generate examples/Card.tsx
 */

import React, { useState, useEffect } from 'react';

interface CardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Image URL */
  imageUrl?: string;
  /** Tags */
  tags?: string[];
  /** Click handler */
  onClick?: () => void;
  /** Whether the card is featured */
  featured?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  imageUrl,
  tags = [],
  onClick,
  featured = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = imageUrl;
    }
  }, [imageUrl]);

  return (
    <div
      className={`card ${featured ? 'card--featured' : ''} ${isHovered ? 'card--hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      data-testid="card"
    >
      {imageUrl && imageLoaded && (
        <img src={imageUrl} alt={title} className="card__image" />
      )}
      <div className="card__content">
        <h3 className="card__title">{title}</h3>
        <p className="card__description">{description}</p>
        {tags.length > 0 && (
          <div className="card__tags">
            {tags.map((tag) => (
              <span key={tag} className="card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;

