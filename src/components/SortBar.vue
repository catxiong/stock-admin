<template>
  <div class="sort-bar">
    <span class="sort-label" v-if="sortItems.length > 0">排序：</span>
    <div class="sort-items">
      <el-tag
        v-for="(item, index) in sortItems"
        :key="item.field"
        closable
        :type="index === 0 ? '' : 'info'"
        @close="removeSort(index)"
        class="sort-tag"
      >
        <span class="sort-tag-text" @click="toggleOrder(index)">
          {{ item.label }}
          <el-icon size="12"><ArrowUp v-if="item.order === 'asc'"/><ArrowDown v-else/></el-icon>
        </span>
      </el-tag>
    </div>
    <el-popover placement="bottom-start" :width="320" trigger="click" v-model:visible="popoverVisible">
      <template #reference>
        <el-button size="small" :icon="Sort" type="primary" plain>添加排序</el-button>
      </template>
      <div class="sort-popover">
        <div v-for="opt in availableFields" :key="opt.field" class="sort-option" @click="addSort(opt)">
          <el-icon><Plus/></el-icon>
          <span>{{ opt.label }}</span>
        </div>
        <div v-if="availableFields.length === 0" class="sort-empty">所有指标已添加</div>
      </div>
    </el-popover>
    <el-button v-if="sortItems.length > 0" size="small" text type="danger" @click="clearSort">清空排序</el-button>
  </div>
</template>

<script setup>
const props = defineProps({
  fields: {type: Array, required: true},
  modelValue: {type: Array, default: () => []},
})
const emit = defineEmits(['update:modelValue', 'change'])

const popoverVisible = ref(false)
const sortItems = computed(() => props.modelValue)

const availableFields = computed(() => {
  const usedFields = sortItems.value.map(s => s.field)
  return props.fields.filter(f => !usedFields.includes(f.field))
})

const addSort = (opt) => {
  const newItems = [...sortItems.value, {field: opt.field, label: opt.label, order: 'desc'}]
  emit('update:modelValue', newItems)
  emit('change', newItems)
  popoverVisible.value = false
}

const removeSort = (index) => {
  const newItems = [...sortItems.value]
  newItems.splice(index, 1)
  emit('update:modelValue', newItems)
  emit('change', newItems)
}

const toggleOrder = (index) => {
  const newItems = [...sortItems.value]
  newItems[index] = {...newItems[index], order: newItems[index].order === 'asc' ? 'desc' : 'asc'}
  emit('update:modelValue', newItems)
  emit('change', newItems)
}

const clearSort = () => {
  emit('update:modelValue', [])
  emit('change', [])
}
</script>

<style lang="scss" scoped>
.sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .sort-label {
    font-size: 13px;
    color: #606266;
    white-space: nowrap;
  }

  .sort-items {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sort-tag {
    .sort-tag-text {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
  }
}

.sort-popover {
  .sort-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;

    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
    }
  }

  .sort-empty {
    padding: 12px;
    color: #909399;
    font-size: 13px;
    text-align: center;
  }
}
</style>
