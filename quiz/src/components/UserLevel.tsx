import React from 'react';
interface UserLevelProps {
  level: number;
  xp: number;
  maxXp: number;
}
const UserLevel: React.FC<UserLevelProps> = ({
  level,
  xp,
  maxXp
}) => {
  const progress = xp / maxXp * 100;
  return <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span>Level {level}</span>
        <span>
          {xp}/{maxXp} XP
        </span>
      </div>
      <div className="w-full bg-[#141b2d] h-2 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{
        width: `${progress}%`
      }}></div>
      </div>
    </div>;
};
export default UserLevel;