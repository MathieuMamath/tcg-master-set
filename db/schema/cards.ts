import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

// The card catalogue is imported from outside the repository with `pnpm cards:import`.

export const cardSets = pgTable('card_sets', {
  id: text('id').primaryKey(),
  releaseDate: text('release_date').notNull(),
  officialCardCount: integer('official_card_count').notNull(),
  totalCardCount: integer('total_card_count').notNull(),
  symbolUrl: text('symbol_url'),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cardSetTranslations = pgTable(
  'card_set_translations',
  {
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
  },
  (table) => [primaryKey({ columns: [table.setId, table.locale] })],
);

export const cards = pgTable(
  'cards',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.id, { onDelete: 'cascade' }),
    localId: text('local_id').notNull(),
    category: text('category').notNull(),
    // In English whatever the player's language, because game rules compare it.
    rarity: text('rarity'),
  },
  (table) => [index('cards_set_id_idx').on(table.setId)],
);

export const cardTranslations = pgTable(
  'card_translations',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    rarity: text('rarity'),
    // Without a quality and format suffix, such as /high.webp.
    imageUrl: text('image_url'),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.locale] })],
);

export const cardVariants = pgTable(
  'card_variants',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    variant: text('variant').notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.variant] })],
);
