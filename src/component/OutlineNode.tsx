import type { OutlineData } from "../types";

type OutlineProps = OutlineData;

const OutlineNode = ({ id, title, content, childrenIds }: OutlineProps) => {
  console.log(id, title, content, childrenIds);
  return (
    <>
      <div>{title}</div>
      <div>{content}</div>
    </>
  );
};

export default OutlineNode;