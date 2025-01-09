import React, {FC} from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Image from "next/image";
import {log} from "@prisma/client";
import {getCloudinaryUrls} from "../utils/imageUtils";

const Log: FC<{meal: log}> = ({meal}) => {
  const imageUrls = meal.pic_id1 ? getCloudinaryUrls(meal.pic_id1) : null;
  return (
    <div>
      <>
        <ReactMarkdown className="text-gray-600 mb-4" remarkPlugins={[remarkBreaks]}>
          {meal.contents}
        </ReactMarkdown>
        {imageUrls && (
          <Image
            className="rounded-lg"
            src={imageUrls.srcUrl}
            alt="Meal"
            width={500}
            height={500}
            placeholder="blur"
            blurDataURL={imageUrls.blurUrl}
          />
        )}
        <p className="text-sm text-gray-500 mt-1">{`position ${
          meal.position !== null ? meal.position : "null"
        }`}</p>
        <p className="text-sm text-gray-500 mt-2">
          Created: {new Date(meal.created_at).toLocaleDateString()}
          Updated: {new Date(meal.updated_at).toLocaleDateString()}
        </p>
      </>
    </div>
  );
};
export default Log;
