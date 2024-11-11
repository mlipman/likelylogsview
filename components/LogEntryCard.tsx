import React, { FC, useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface LogEntry {
  // message: string;
  // backend_info: string;
}

/*
const LogEntryList: FC<{ entries: LogEntry[];}> = ({
  entries,
}) => {
*/
const LogEntryCard: FC<LogEntry> = () => {
  const [logEntry, setLogEntry] = useState<LogEntry>({
    message: '',
    backend_info: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLogEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/updateLogEntry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
      if (response.ok) {
        alert('Log entry updated successfully!');
      } else {
        throw new Error('Failed to update log entry');
      }
    } catch (error) {
      console.error('Error updating log entry:', error);
      alert('Failed to update log entry. Please try again.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">Message</label>
              <Textarea
                id="message"
                name="message"
                value={logEntry.message}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter log message..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="backend_info" className="text-sm font-medium text-gray-700">Backend Info</label>
              <Input
                type="text"
                id="backend_info"
                name="backend_info"
                value={logEntry.backend_info}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter backend info..."
                maxLength={30}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LogEntryCard;