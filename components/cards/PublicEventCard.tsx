import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { formatEventDescription } from "@/lib/formatters";
import Link from "next/link";
import { Button } from "../ui/button";

type PublicEventCardProps = {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  clerkUserId: string;
};

export default function PublicEventCard({
  id,
  name,
  description,
  durationInMinutes,
  clerkUserId,
}: PublicEventCardProps) {
  return (
    <Card className="flex flex-col border-4 border-blue-500/10 shadow-2xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {formatEventDescription(durationInMinutes)}
        </CardDescription>
      </CardHeader>

      {description != null && (
        <CardContent>{description}</CardContent>
      )}
      

      <CardFooter className="flex justify-end gap-2 mt-auto">

        <Button
          className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
          asChild
        >
          <Link href={`/book/${clerkUserId}/${id}`}>Select</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
