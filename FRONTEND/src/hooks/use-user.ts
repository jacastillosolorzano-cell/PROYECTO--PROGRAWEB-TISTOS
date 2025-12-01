import { useState, useEffect } from 'react';
import { calculateLevel, gainPoints } from '../lib/utils';

export interface User {
  id: string;
  name: string;
  points: number;
  level: number;
}

export const useUser = (initialUser?: Partial<User>) => {
  const [user, setUser] = useState<User>(() => {
     const stored = localStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<User>;
      return { 
        id: parsed.id || '1',
        name: parsed.name || 'Usuario Invitado',
        points: parsed.points || 0,
        level: calculateLevel(parsed.points || 0),
        ...initialUser,
      };
    }
    return {
      id: '1',
      name: 'Usuario Invitado',
      points: 0,
      level: 1,
      ...initialUser,
    };
  });

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, [user]);

  const updatePoints = (activity: string) => {
    const oldPoints = user.points;
    const newPoints = gainPoints(oldPoints, activity);
    const newLevel = calculateLevel(newPoints);
    const didLevelUp = newLevel > user.level;

    setUser({ ...user, points: newPoints, level: newLevel });

    
    return { didLevelUp, newLevel };
  };

  
  const setCurrentUser = (newUser: Partial<User>) => {
    const updated = { 
      ...user, 
      ...newUser, 
      level: calculateLevel(newUser.points || user.points) 
    };
    setUser(updated);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user.name !== 'Usuario Invitado') {
      interval = setInterval(() => {
        updatePoints('watchVideo');
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [user.name]);

  return { user, updatePoints, setCurrentUser };
};
