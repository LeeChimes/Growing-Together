import React, { memo, useMemo, useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../design';
import { useRenderPerformance } from '../lib/performance';

const { height: screenHeight } = Dimensions.get('window');

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  itemHeight?: number;
  estimatedItemSize?: number;
  loadingComponent?: React.ReactElement;
  emptyComponent?: React.ReactElement;
  loading?: boolean; // back-compat prop used by some screens
  onEndReachedThreshold?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  debug?: boolean;
}

/**
 * Optimized list component with built-in virtualization and performance monitoring
 * Implements Step 16 requirement for list virtualization
 */
export function OptimizedList<T>({
  data,
  renderItem,
  itemHeight,
  estimatedItemSize = 100,
  loadingComponent,
  emptyComponent,
  loading,
  onEndReachedThreshold = 0.1,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  initialNumToRender = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  debug = false,
  ...flatListProps
}: OptimizedListProps<T>) {
  const theme = useTheme();
  const renderTime = useRenderPerformance('OptimizedList');

  // Memoize the keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: any, index: number) => {
    if (item && typeof item === 'object') {
      return item.id?.toString() || item.key?.toString() || index.toString();
    }
    return index.toString();
  }, []);

  // Memoize the item separator to prevent re-renders
  const ItemSeparatorComponent = useMemo(() => {
    if (flatListProps.ItemSeparatorComponent) {
      return flatListProps.ItemSeparatorComponent;
    }
    return null;
  }, [flatListProps.ItemSeparatorComponent]);

  // Optimized render item with memoization
  const MemoizedRenderItem = memo(({ item, index }: { item: T; index: number }) => {
    return renderItem({ item, index });
  });

  // Get item layout for better performance (if itemHeight is provided)
  const getItemLayout = useMemo(() => {
    if (itemHeight) {
      return (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [itemHeight]);

  // Loading state
  if (loading && loadingComponent) {
    return loadingComponent;
  }

  // Empty state
  if (data && data.length === 0 && emptyComponent) {
    return emptyComponent;
  }

  // Default loading component
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.green} />
        <Text style={[styles.loadingText, { color: theme.colors.gray }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // Debug information
  if (debug && __DEV__) {
    console.log(`📊 OptimizedList render - Items: ${data.length}, Render time: ${renderTime.toFixed(2)}ms`);
  }

  return (
    <>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <MemoizedRenderItem item={item} index={index} />
        )}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparatorComponent}
        
        // Performance optimizations
        maxToRenderPerBatch={maxToRenderPerBatch}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
        initialNumToRender={initialNumToRender}
        windowSize={windowSize}
        removeClippedSubviews={removeClippedSubviews}
        onEndReachedThreshold={onEndReachedThreshold}
        
        // Memory management
        disableVirtualization={false}
        legacyImplementation={false}
        
        // Performance monitoring
        onViewableItemsChanged={debug ? ({ viewableItems }) => {
          if (__DEV__) {
            console.log(`📊 Viewable items: ${viewableItems.length}`);
          }
        } : undefined}
        
        {...flatListProps}
      />
      
      {debug && __DEV__ && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>
            Items: {data.length} | Render: {renderTime.toFixed(1)}ms
          </Text>
        </View>
      )}
    </>
  );
}

/**
 * Specialized optimized list for images with lazy loading
 */
export function OptimizedImageList<T extends { id: string; imageUri?: string }>({
  data,
  renderItem,
  imageHeight = 200,
  ...props
}: OptimizedListProps<T> & { imageHeight?: number }) {
  const LazyImageItem = memo(({ item, index }: { item: T; index: number }) => {
    return (
      <LazyImageContainer height={imageHeight}>
        {renderItem({ item, index })}
      </LazyImageContainer>
    );
  });

  return (
    <OptimizedList
      data={data}
      renderItem={({ item, index }) => <LazyImageItem item={item} index={index} />}
      itemHeight={imageHeight}
      estimatedItemSize={imageHeight}
      {...props}
    />
  );
}

/**
 * Container for lazy loading images
 */
const LazyImageContainer: React.FC<{
  children: React.ReactNode;
  height: number;
}> = memo(({ children, height }) => {
  return (
    <View style={[styles.lazyContainer, { minHeight: height }]}>
      {children}
    </View>
  );
});

/**
 * Optimized grid list for gallery-style layouts
 */
export function OptimizedGridList<T>({
  data,
  renderItem,
  numColumns = 2,
  itemHeight,
  spacing = 8,
  ...props
}: OptimizedListProps<T> & {
  numColumns?: number;
  spacing?: number;
}) {
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - spacing * (numColumns + 1)) / numColumns;

  const GridItem = memo(({ item, index }: { item: T; index: number }) => (
    <View style={[styles.gridItem, { width: itemWidth, marginBottom: spacing }]}>
      {renderItem({ item, index })}
    </View>
  ));

  return (
    <OptimizedList
      data={data}
      renderItem={({ item, index }) => <GridItem item={item} index={index} />}
      numColumns={numColumns}
      itemHeight={itemHeight}
      columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
      contentContainerStyle={{ padding: spacing }}
      {...props}
    />
  );
}

/**
 * Skeleton loading component for lists
 */
export const ListSkeleton: React.FC<{
  itemHeight?: number;
  itemCount?: number;
  showImage?: boolean;
}> = ({ itemHeight = 80, itemCount = 5, showImage = false }) => {
  const theme = useTheme();
  
  const SkeletonItem = memo(() => (
    <View style={[styles.skeletonItem, { height: itemHeight }]}>
      {showImage && (
        <View style={[styles.skeletonImage, { backgroundColor: theme.colors.grayLight }]} />
      )}
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: theme.colors.grayLight }]} />
        <View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: theme.colors.grayLight }]} />
      </View>
    </View>
  ));

  const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }));

  return (
    <View>
      {items.map((item) => (
        <SkeletonItem key={item.id} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    margin: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  lazyContainer: {
    justifyContent: 'center',
  },
  gridItem: {
    flex: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  // Skeleton styles
  skeletonItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  skeletonImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '70%',
  },
  skeletonSubtitle: {
    width: '40%',
  },
});