import React from "react";
import { cn, getTechLogos } from "@/lib/utils";
import Image from "next/image";

const DisplayTechIcons = async ({ techStack }: TechIconProps) => {
  const techIcons = await getTechLogos(techStack);

  return (
    <div className="flex flex-row items-center">
      {techIcons.slice(0, 4).map(({ tech, url }, index) => (
        <div
          key={`${tech}-${index}`}
          className={cn(
            "relative group/tech bg-dark-300 border border-white/10 rounded-full p-2 flex-center transition-transform duration-150 hover:scale-110 hover:z-20",
            index >= 1 && "-ml-2.5"
          )}
        >
          <span className="tech-tooltip group-hover/tech:flex">{tech}</span>
          <Image
            src={url}
            alt={tech}
            width={100}
            height={100}
            className="size-5 object-contain"
          />
        </div>
      ))}
    </div>
  );
};
export default DisplayTechIcons;
