import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function Debug() {
  const [data, setData] = useState<any>(null);

  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('allobricolage_users') || '[]');
    const technicians = JSON.parse(localStorage.getItem('allobricolage_technicians') || '[]');
    const jobs = JSON.parse(localStorage.getItem('allobricolage_jobs') || '[]');
    const bookings = JSON.parse(localStorage.getItem('allobricolage_bookings') || '[]');
    const version = localStorage.getItem('allobricolage_seed_version');

    setData({
      version,
      users: users.length,
      technicians: technicians.length,
      jobs: jobs.length,
      bookings: bookings.length,
      sampleTechnicians: technicians.slice(0, 3),
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    if (import.meta.env.DEV) {
      const { resetSeedData } = await import("@/data/seedData");
      resetSeedData();
      loadData();
      alert('Data reset! Refresh the page.');
    } else {
      alert('Debug functions are only available in development mode.');
    }
  };

  const handleCheck = async () => {
    if (import.meta.env.DEV) {
      const { checkSeedData } = await import("@/data/seedData");
      checkSeedData();
      loadData();
    } else {
      console.log('Debug functions are only available in development mode.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Debug Page</h1>

        <Card className="p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Seed Data Status</h2>
          {data && (
            <div className="space-y-2">
              <p><strong>Version:</strong> {data.version || 'Not set'}</p>
              <p><strong>Users:</strong> {data.users}</p>
              <p><strong>Technicians:</strong> {data.technicians}</p>
              <p><strong>Jobs:</strong> {data.jobs}</p>
              <p><strong>Bookings:</strong> {data.bookings}</p>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Sample Technicians</h2>
          {data?.sampleTechnicians?.map((tech: any) => (
            <div key={tech.id} className="mb-2 p-2 bg-muted rounded">
              <p><strong>{tech.name}</strong></p>
              <p className="text-sm">Services: {tech.services.join(', ')}</p>
              <p className="text-sm">City: {tech.city}</p>
            </div>
          ))}
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleCheck}>
            Check Data (Console)
          </Button>
          <Button onClick={handleReset} variant="destructive">
            Reset Seed Data
          </Button>
          <Button onClick={loadData} variant="outline">
            Refresh
          </Button>
        </div>

        <Card className="p-6 mt-4">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Click "Check Data (Console)" to see detailed logs</li>
            <li>If data is missing, click "Reset Seed Data"</li>
            <li>Refresh the page after reset</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

