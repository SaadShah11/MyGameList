import { useEffect, useMemo, useState } from 'react'
import {
  clampPageSize,
  paginate,
  totalPages,
  type PageSizeOption,
} from '../lib/pagination'

interface UsePaginationOptions {
  total: number
  defaultPageSize: number
  resetKey?: string | number
}

export function usePagination({
  total,
  defaultPageSize,
  resetKey,
}: UsePaginationOptions) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<PageSizeOption>(() =>
    clampPageSize(defaultPageSize),
  )

  useEffect(() => {
    setPageSizeState(clampPageSize(defaultPageSize))
    setPage(1)
  }, [defaultPageSize])

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const pages = totalPages(total, pageSize)

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

  const setPageSize = (size: number) => {
    setPageSizeState(clampPageSize(size))
    setPage(1)
  }

  return {
    page,
    pageSize,
    pages,
    setPage,
    setPageSize,
  }
}

export function usePagedItems<T>(
  items: T[],
  defaultPageSize: number,
  resetKey?: string | number,
) {
  const { page, pageSize, pages, setPage, setPageSize } = usePagination({
    total: items.length,
    defaultPageSize,
    resetKey,
  })

  const paged = useMemo(
    () => paginate(items, page, pageSize),
    [items, page, pageSize],
  )

  return {
    page,
    pageSize,
    pages,
    setPage,
    setPageSize,
    items: paged,
    total: items.length,
  }
}
