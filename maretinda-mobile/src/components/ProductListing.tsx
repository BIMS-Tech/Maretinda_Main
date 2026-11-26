import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EASE_OUT, Press, ProductGridSkeleton, Segmented } from '@/components/motion';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRegion } from '@/context/region';
import { searchProducts, type SearchOptions, type Sort, SORTS } from '@/lib/products';
import { formatPrice } from '@/lib/utils';
import { colors } from '@/theme';
import type { SearchResult } from '@/types';

type Filters = Pick<SearchOptions, 'on_sale' | 'in_stock' | 'verified' | 'min_price' | 'max_price' | 'rating'>;
const NONE: Filters = {};

const SWITCHES = [
  { key: 'on_sale', label: 'On sale' },
  { key: 'in_stock', label: 'In stock' },
  { key: 'verified', label: 'Verified shops' },
] as const;

/** A search, a category or a shop: its products, how they're sorted, and what they're limited to. */
export function ProductListing({ scope, q = '', header }: { scope?: Pick<SearchOptions, 'category' | 'collection_id' | 'seller'>; q?: string; header?: React.ReactElement | null }) {
  const { region } = useRegion();
  const [picked, setPicked] = useState<Sort | null>(null);
  const [filters, setFilters] = useState<Filters>(NONE);
  const [sheet, setSheet] = useState(false);

  const sort: Sort = picked ?? (q ? 'relevance' : 'popular');
  const options = { ...scope, ...filters, q, sort };

  const { data, isLoading, isError, refetch, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['search', region?.id, options],
    queryFn: ({ pageParam }): Promise<SearchResult> => searchProducts({ ...options, limit: 24, page: pageParam, regionId: region!.id }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    enabled: !!region?.id,
  });

  const first = data?.pages[0];
  const products = data?.pages.flatMap((p) => p.products) ?? [];
  const count = Object.values(filters).filter((v) => v != null && v !== false).length;
  const toggle = (key: (typeof SWITCHES)[number]['key']) => setFilters((f) => ({ ...f, [key]: f[key] ? undefined : true }));

  const chips: { key: string; label: string; off: () => void }[] = [
    ...SWITCHES.filter((s) => filters[s.key]).map((s) => ({ key: s.key, label: s.label, off: () => toggle(s.key) })),
    ...(filters.min_price != null || filters.max_price != null
      ? [
          {
            key: 'price',
            label:
              filters.min_price != null && filters.max_price != null
                ? `${formatPrice(filters.min_price)} – ${formatPrice(filters.max_price)}`
                : filters.min_price != null
                  ? `From ${formatPrice(filters.min_price)}`
                  : `Up to ${formatPrice(filters.max_price!)}`,
            off: () => setFilters((f) => ({ ...f, max_price: undefined, min_price: undefined })),
          },
        ]
      : []),
    ...(filters.rating ? [{ key: 'rating', label: `${filters.rating}★ and up`, off: () => setFilters((f) => ({ ...f, rating: undefined })) }] : []),
  ];

  const top = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      {header}
      <Segmented
        label="Sort by"
        onChange={setPicked}
        options={[...(q ? [{ label: 'Best match', value: 'relevance' as Sort }] : []), ...SORTS.map((s) => ({ ...s, value: s.value as Sort }))]}
        value={sort}
      />
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {first ? (first.did_you_mean && !products.length ? `Did you mean “${first.did_you_mean}”?` : `${first.count.toLocaleString('en-PH')} ${first.count === 1 ? 'product' : 'products'}`) : ' '}
        </Text>
        <Press accessibilityLabel={count ? `Filters, ${count} on` : 'Filters'} onPress={() => setSheet(true)} scale={0.93} style={{ alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, height: 36, paddingHorizontal: 14 }}>
          <Ionicons color={colors.purple} name="options-outline" size={16} />
          <Text style={{ color: colors.purple, fontSize: 13, fontWeight: '700' }}>Filters</Text>
          {count > 0 && (
            <Animated.View entering={ZoomIn.springify()} key={count} style={{ alignItems: 'center', backgroundColor: colors.yellow, borderRadius: 999, height: 18, justifyContent: 'center', minWidth: 18 }}>
              <Text style={{ color: colors.purple, fontSize: 11, fontWeight: '800' }}>{count}</Text>
            </Animated.View>
          )}
        </Press>
      </View>
      {chips.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 }}>
          {chips.map((chip) => (
            <Animated.View entering={ZoomIn.duration(220)} exiting={ZoomOut.duration(150)} key={chip.key} layout={LinearTransition.duration(240).easing(EASE_OUT)}>
              <Press accessibilityLabel={`Remove ${chip.label}`} onPress={chip.off} style={{ alignItems: 'center', backgroundColor: '#F1EDF6', borderRadius: 999, flexDirection: 'row', gap: 6, height: 32, paddingLeft: 14, paddingRight: 10 }}>
                <Text style={{ color: colors.purple, fontSize: 12.5, fontWeight: '600' }}>{chip.label}</Text>
                <Ionicons color={colors.purple} name="close" size={14} />
              </Press>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <ProductGrid
        empty={
          isLoading ? (
            <ProductGridSkeleton />
          ) : isError ? (
            <EmptyState action="Try again" icon="cloud-offline-outline" onPress={() => refetch()} title="We couldn't load these">
              Check your connection and try again.
            </EmptyState>
          ) : (
            <EmptyState action={count ? 'Clear filters' : undefined} icon="search-outline" onPress={() => setFilters(NONE)} title={q ? `Nothing for “${q}”` : 'Nothing here yet'}>
              {count ? 'Try with fewer filters.' : first?.did_you_mean ? `Did you mean “${first.did_you_mean}”?` : 'Try another word, or browse the categories.'}
            </EmptyState>
          )
        }
        header={top}
        loadingMore={isFetchingNextPage}
        onEnd={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        products={products}
        refreshKey={JSON.stringify(options)}
      />
      <FilterSheet
        counts={first}
        filters={filters}
        key={sheet ? 'open' : 'closed'}
        onApply={(next) => {
          setFilters(next);
          setSheet(false);
        }}
        onClose={() => setSheet(false)}
        visible={sheet}
      />
    </>
  );
}

function Option({ label, note, on, onPress }: { label: string; note?: string; on: boolean; onPress: () => void }) {
  return (
    <Press accessibilityState={{ selected: on }} onPress={onPress} scale={0.95} style={{ backgroundColor: on ? colors.purple : '#F6F3F9', borderRadius: 999, flexDirection: 'row', gap: 6, height: 38, alignItems: 'center', paddingHorizontal: 16 }}>
      <Text style={{ color: on ? colors.white : colors.ink, fontSize: 13.5, fontWeight: '600' }}>{label}</Text>
      {note ? <Text style={{ color: on ? 'rgba(255,255,255,0.7)' : colors.faint, fontSize: 12 }}>{note}</Text> : null}
    </Press>
  );
}

const amountOf = (text: string) => {
  const n = Number(text.replace(/[^\d.]/g, ''));
  return text.trim() && Number.isFinite(n) ? n : undefined;
};

function FilterSheet({
  visible,
  filters,
  counts,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: Filters;
  counts?: { on_sale_count: number; in_stock_count: number; verified_count: number };
  onApply: (filters: Filters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Filters>(filters);
  const [min, setMin] = useState(filters.min_price?.toString() ?? '');
  const [max, setMax] = useState(filters.max_price?.toString() ?? '');
  const noted: Record<string, number | undefined> = { in_stock: counts?.in_stock_count, on_sale: counts?.on_sale_count, verified: counts?.verified_count };

  const apply = () => {
    const a = amountOf(min);
    const b = amountOf(max);
    onApply({ ...draft, max_price: a != null && b != null ? Math.max(a, b) : b, min_price: a != null && b != null ? Math.min(a, b) : a });
  };
  const field = { backgroundColor: '#F6F3F9', borderRadius: 14, color: colors.ink, flex: 1, fontSize: 15, height: 48, minWidth: 0, paddingHorizontal: 16 } as const;

  return (
    <Modal animationType="none" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={{ backgroundColor: 'rgba(30,20,48,0.45)', flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close filters" onPress={onClose} style={{ flex: 1 }} />
        <Animated.View entering={SlideInDown.duration(420).easing(EASE_OUT)} exiting={SlideOutDown.duration(240)} style={{ backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: insets.bottom + 16, paddingTop: 10 }}>
          <View style={{ alignSelf: 'center', backgroundColor: '#E3DDEA', borderRadius: 999, height: 4, marginBottom: 14, width: 44 }} />
          <ScrollView contentContainerStyle={{ gap: 22, paddingHorizontal: 20, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>Show only</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SWITCHES.map((s) => (
                  <Option key={s.key} label={s.label} note={noted[s.key]?.toLocaleString('en-PH')} on={!!draft[s.key]} onPress={() => setDraft((d) => ({ ...d, [s.key]: d[s.key] ? undefined : true }))} />
                ))}
              </View>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>Price</Text>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                <TextInput accessibilityLabel="Lowest price" keyboardType="number-pad" onChangeText={setMin} placeholder="₱ From" placeholderTextColor={colors.faint} style={field} value={min} />
                <Text style={{ color: colors.faint }}>–</Text>
                <TextInput accessibilityLabel="Highest price" keyboardType="number-pad" onChangeText={setMax} placeholder="₱ To" placeholderTextColor={colors.faint} style={field} value={max} />
              </View>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>Rating</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[4, 3, 2].map((n) => (
                  <Option key={n} label={`${n}★ and up`} on={draft.rating === n} onPress={() => setDraft((d) => ({ ...d, rating: d.rating === n ? undefined : n }))} />
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 }}>
            <Button onPress={() => onApply(NONE)} title="Clear all" variant="outline" />
            <View style={{ flex: 1 }}>
              <Button onPress={apply} title="Show products" />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
