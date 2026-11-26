import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EASE_OUT, Press, Rise } from '@/components/motion';
import { ProductListing } from '@/components/ProductListing';
import { useRegion } from '@/context/region';
import { suggest } from '@/lib/products';
import { useDebounced } from '@/lib/use-debounced';
import { colors } from '@/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { region } = useRegion();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const settled = useDebounced(text.trim());

  const { data } = useQuery({
    enabled: typing && !!region?.id,
    placeholderData: (previous) => previous,
    queryFn: () => suggest(settled, region?.id),
    queryKey: ['suggest', settled, region?.id],
  });

  const search = (words: string) => {
    setText(words);
    setQ(words.trim());
    setTyping(false);
    input.current?.blur();
  };

  const box = useAnimatedStyle(() => ({ borderColor: withTiming(typing ? colors.purple : colors.line, { duration: 220, easing: EASE_OUT }) }));
  const categories = data?.categories.slice(0, 8) ?? [];
  const shops = data?.shops.slice(0, 3) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 8 }}>
        <Animated.View layout={LinearTransition.duration(260).easing(EASE_OUT)} style={[{ alignItems: 'center', backgroundColor: colors.white, borderRadius: 999, borderWidth: 1.5, flex: 1, flexDirection: 'row', gap: 10, height: 48, paddingHorizontal: 16 }, box]}>
          <Ionicons color={colors.purple} name="search" size={18} />
          <TextInput
            accessibilityLabel="Search for products"
            autoCorrect={false}
            onChangeText={setText}
            onFocus={() => setTyping(true)}
            onSubmitEditing={() => search(text)}
            placeholder="Search for products"
            placeholderTextColor={colors.faint}
            ref={input}
            returnKeyType="search"
            style={{ color: colors.ink, flex: 1, fontSize: 15, height: '100%' }}
            value={text}
          />
          {text.length > 0 && (
            <Pressable
              accessibilityLabel="Clear"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                setText('');
                setQ('');
                input.current?.focus();
              }}
            >
              <Ionicons color={colors.faint} name="close-circle" size={18} />
            </Pressable>
          )}
        </Animated.View>
        {typing && (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => search(q)}>
              <Text style={{ color: colors.purple, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {typing ? (
        <ScrollView contentContainerStyle={{ gap: 22, paddingBottom: 40, paddingHorizontal: 16, paddingTop: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {settled && data?.did_you_mean && (
            <Pressable onPress={() => search(data.did_you_mean!)}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                Did you mean <Text style={{ color: colors.purple, fontWeight: '700' }}>{data.did_you_mean}</Text>?
              </Text>
            </Pressable>
          )}
          {categories.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>{settled ? 'CATEGORIES' : 'POPULAR CATEGORIES'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((c, i) => (
                  <Rise index={i} key={c.handle} layout>
                    <Press onPress={() => router.push(`/category/${c.handle}`)} style={{ backgroundColor: colors.white, borderColor: colors.line, borderRadius: 999, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 9 }}>
                      <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '600' }}>{c.name}</Text>
                    </Press>
                  </Rise>
                ))}
              </View>
            </View>
          )}
          {(data?.products.length ?? 0) > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 }}>{settled ? 'PRODUCTS' : 'POPULAR NOW'}</Text>
              {data!.products.map((p, i) => (
                <Rise index={i} key={p.id} layout>
                  <Press onPress={() => router.push(`/product/${p.id}`)} scale={0.98} style={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 9 }}>
                    <Ionicons color={colors.faint} name="search-outline" size={17} />
                    <Text numberOfLines={1} style={{ color: colors.ink, flex: 1, fontSize: 14.5 }}>
                      {p.title}
                    </Text>
                    <Ionicons color={colors.faint} name="arrow-forward-outline" size={16} style={{ transform: [{ rotate: '-45deg' }] }} />
                  </Press>
                </Rise>
              ))}
            </View>
          )}
          {shops.length > 0 && settled ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 }}>SHOPS</Text>
              {shops.map((shop) => (
                <Press key={shop.handle} onPress={() => router.push(`/seller/${shop.handle}`)} scale={0.98} style={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 9 }}>
                  <Ionicons color={colors.purple} name="storefront-outline" size={17} />
                  <Text style={{ color: colors.ink, fontSize: 14.5 }}>{shop.name}</Text>
                </Press>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ProductListing q={q} />
      )}
    </SafeAreaView>
  );
}
