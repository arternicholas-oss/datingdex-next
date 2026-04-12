"use client";

import { Suspense } from "react";
import PlanFormInner from "./PlanFormInner";

export default function PlanForm() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", color: "#999" }}>Loading planner...</div>}>
      <PlanFormInner />
    </Suspense>
  );
}
