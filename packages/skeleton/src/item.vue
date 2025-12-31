<template>
  <div :class="['el-skeleton__item', `el-skeleton__${variant}`]">
    <img-placeholder v-if="variant === 'image'" />
  </div>
</template>

<script>
  import ImgPlaceholder from './img-placeholder';

  export default {
    name: 'ElSkeletonItem',
    components: {
      [ImgPlaceholder.name]: ImgPlaceholder
    },
    props: {
      variant: {
        type: String,
        default: 'text'
      }
    },
  };
</script>