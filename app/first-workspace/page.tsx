"use client";

import { FirstWorkspace } from "./FirstWorkspace";

type PageProps = {
  params: {
    user: string;
    workspace: string;
  };
};

const First = ({ params }: PageProps) => {
  void params;
  return (
    <div>
      <FirstWorkspace />
    </div>
  );
};

export default First;
