import { UserContext } from "../../types";
import { IQuote } from "./quotes.model";

export const submissionStatus = (role?: string): IQuote["status"] =>
  role === "admin" ? "published" : "pending";

export const canViewQuote = (
  status: IQuote["status"],
  ownerId: string | undefined,
  user?: UserContext,
): boolean =>
  status === "published" ||
  user?.role === "admin" ||
  (!!ownerId && ownerId === user?.id);

export const canManageQuote = (
  ownerId: string | undefined,
  user: UserContext,
): boolean => user.role === "admin" || (!!ownerId && ownerId === user.id);

export const statusAfterQuoteEdit = (
  currentStatus: IQuote["status"],
  role?: string,
): IQuote["status"] => (role === "admin" ? currentStatus : "pending");
