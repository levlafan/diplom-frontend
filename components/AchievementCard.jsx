// components/AchievementCard.jsx
"use client";

import { 
  BookOpen, PenTool, Users, Star, Heart, MessageSquare, 
  Flame, Crown, Layers, CheckCircle2, Zap, Trophy, Award,
  Target, Coffee, Rocket, Gem, Shield, Code, Camera, Music,
  Globe, Lock, Unlock, Gift, Calendar, Clock, Eye, ThumbsUp,
  Library, Moon, Sun
} from "lucide-react";
import { RARITY_CONFIG } from "../src/utils/achievements";
import styles from "./AchievementCard.module.css";

const IconMap = {
  BookOpen: BookOpen,
  PenTool: PenTool,
  Users: Users,
  Star: Star,
  Heart: Heart,
  MessageSquare: MessageSquare,
  Flame: Flame,
  Crown: Crown,
  Layers: Layers,
  CheckCircle2: CheckCircle2,
  Zap: Zap,
  Trophy: Trophy,
  Award: Award,
  Target: Target,
  Coffee: Coffee,
  Rocket: Rocket,
  Gem: Gem,
  Shield: Shield,
  Code: Code,
  Camera: Camera,
  Music: Music,
  Globe: Globe,
  Lock: Lock,
  Unlock: Unlock,
  Gift: Gift,
  Calendar: Calendar,
  Clock: Clock,
  Eye: Eye,
  ThumbsUp: ThumbsUp,
  Library: Library,
  Moon: Moon,
  Sun: Sun,
};

export default function AchievementCard({ achievement, unlocked, progress = null }) {
  const rarity = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  const IconComponent = IconMap[achievement.icon] || Award;

  return (
    <div className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}>
      <div className={styles.cardInner}>
        <div className={styles.iconSection}>
          <div className={styles.iconWrapper} style={{ backgroundColor: rarity.bgColor }}>
            <IconComponent 
              size={32} 
              className={styles.icon}
              style={{ color: unlocked ? rarity.color : "#4a4a4a" }}
            />
          </div>
          {unlocked && (
            <div className={styles.unlockedBadge}>
              <CheckCircle2 size={14} />
            </div>
          )}
        </div>
        
        <div className={styles.info}>
          <h4 className={styles.title}>{achievement.title}</h4>
          <p className={styles.description}>{achievement.description}</p>
          
          <div className={styles.meta}>
            <span className={styles.rarityBadge} style={{ 
              backgroundColor: rarity.bgColor,
              color: rarity.color,
              borderColor: rarity.color 
            }}>
              {rarity.label}
            </span>
            
            {!unlocked && progress !== null && (
              <span className={styles.progress}>
                {progress.current} / {progress.required} {achievement.unit}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {!unlocked && (
        <div className={styles.lockedOverlay}>
          <Lock size={20} />
        </div>
      )}
    </div>
  );
}