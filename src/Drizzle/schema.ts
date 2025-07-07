import { relations } from "drizzle-orm";
import { text, varchar, serial, pgTable, decimal, integer, boolean, date, time, timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";



export const userRoleEnum = pgEnum("role_enum", ["user", "admin"]);
export const ticketStatusEnum = pgEnum("ticket_status_enum", ["pending", "confirmed", "cancelled"]);


// Users Table
export const UsersTable = pgTable("users", {
  user_id: serial("user_id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  contact_phone: text("contact_phone"),
  password: varchar("password", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("user"), // assume enum 'user', 'admin'
  verification_code: varchar("verification_code", { length: 10 }),
  is_verified: boolean("is_verified").default(false),
  image_url: varchar("image_url", { length: 500 }),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// Venues Table
export const VenuesTable = pgTable("venues", {
  venue_id: serial("venue_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(),
  image_url: varchar("image_url", { length: 500 }),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// Events Table
export const EventsTable = pgTable("events", {
  event_id: serial("event_id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  venue_id: integer("venue_id").notNull().references(() => VenuesTable.venue_id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  ticket_price: decimal("ticket_price", { precision: 10, scale: 2 }).notNull(),
  tickets_total: integer("tickets_total").notNull(),
  tickets_sold: integer("tickets_sold").notNull().default(0),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// Bookings Table
export const BookingsTable = pgTable("bookings", {
  booking_id: serial("booking_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => UsersTable.user_id, { onDelete: "cascade" }),
  event_id: integer("event_id").notNull().references(() => EventsTable.event_id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  booking_status: varchar("booking_status", { length: 20 }).notNull().default("Pending"),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// Payments Table
export const PaymentsTable = pgTable("payments", {
  payment_id: serial("payment_id").primaryKey(),
  booking_id: integer("booking_id").notNull().references(() => BookingsTable.booking_id, { onDelete: "cascade" }) .unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payment_status: varchar("payment_status", { length: 20 }).notNull().default("Pending"),
  payment_date: timestamp("payment_date").notNull(),
  payment_method: varchar("payment_method", { length: 50 }),
  transaction_id: varchar("transaction_id", { length: 100 }),
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// Support Tickets Table
export const SupportTicketsTable = pgTable("support_tickets", {
  ticket_id: serial("ticket_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => UsersTable.user_id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 150 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Open"),//enum 'Open', 'In Progress', 'Closed'
  created_at: timestamp("created_at").notNull(),
  updated_at: timestamp("updated_at").notNull()
});

// RELATIONSHIPS

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  bookings: many(BookingsTable),
  supportTickets: many(SupportTicketsTable)
}));

export const VenuesRelations = relations(VenuesTable, ({ many }) => ({
  events: many(EventsTable)
}));

export const EventsRelations = relations(EventsTable, ({ one, many }) => ({
  venue: one(VenuesTable, {
    fields: [EventsTable.venue_id],
    references: [VenuesTable.venue_id]
  }),
  bookings: many(BookingsTable)
}));

export const BookingsRelations = relations(BookingsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [BookingsTable.user_id],
    references: [UsersTable.user_id]
  }),
  event: one(EventsTable, {
    fields: [BookingsTable.event_id],
    references: [EventsTable.event_id]
  }),
  payments: many(PaymentsTable)
}));

export const PaymentsRelations = relations(PaymentsTable, ({ one }) => ({
  booking: one(BookingsTable, {
    fields: [PaymentsTable.booking_id],
    references: [BookingsTable.booking_id]
  })
}));

export const SupportTicketsRelations = relations(SupportTicketsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [SupportTicketsTable.user_id],
    references: [UsersTable.user_id]
  })
}));

// TYPES

export type TIUser = typeof UsersTable.$inferInsert;
export type TSUser = typeof UsersTable.$inferSelect;

export type TIVenue = typeof VenuesTable.$inferInsert;
export type TSVenue = typeof VenuesTable.$inferSelect;

export type TIEvent = typeof EventsTable.$inferInsert;
export type TSEvent = typeof EventsTable.$inferSelect;

export type TIBooking = typeof BookingsTable.$inferInsert;
export type TSBooking = typeof BookingsTable.$inferSelect;

export type TIPayment = typeof PaymentsTable.$inferInsert;
export type TSPayment = typeof PaymentsTable.$inferSelect;

export type TISupportTicket = typeof SupportTicketsTable.$inferInsert;
export type TSSupportTicket = typeof SupportTicketsTable.$inferSelect;
