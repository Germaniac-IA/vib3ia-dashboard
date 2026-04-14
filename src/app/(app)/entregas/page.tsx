"use client";

import { PageTitle, Card, Empty } from "../../../components/UI";

export default function EntregasPage() {
  return (
    <div>
      <PageTitle>🚚 Entregas</PageTitle>
      <Card>
        <Empty message="Módulo de entregas en desarrollo" />
      </Card>
    </div>
  );
}
