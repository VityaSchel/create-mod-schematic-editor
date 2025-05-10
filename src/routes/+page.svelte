<script lang="ts">
  import Dropzone from 'svelte-file-dropzone'
  import { Buffer } from 'buffer'
  import { z } from 'zod'
  import saveAs from 'file-saver'
  import path from 'path-browserify'
  import type nbtType from 'prismarine-nbt'
  import { onMount } from 'svelte'
  const nbt = window.require('prismarine-nbt') as typeof import('prismarine-nbt')

  onMount(() => {
    window.Buffer = Buffer
  })

  const nbtSchema = z.object({
    palette: z.object({
      type: z.literal(nbt.TagType.List),
      value: z.object({
        type: z.literal(nbt.TagType.Compound),
        value: z.array(
          z.object({
            Name: z.object({
              type: z.literal(nbt.TagType.String),
              value: z.string()
            })
          })
        )
      })
    })
  })
  type NbtSchema = z.infer<typeof nbtSchema>

  let dragOver = $state(false)
  let uploaded = $state(false)
  let name = $state('')
  let parsedData: {
    parsed: nbtType.NBT
    type: nbtType.NBTFormat
    metadata: nbtType.Metadata
  } | null = $state(null)
  let map: Map<string, number[]> = $state(new Map())
  let replaceMap: { [key: string]: string } = $state({})

  const parse = async (data: ArrayBuffer) => {
    try {
      parsedData = await nbt.parse(Buffer.from(data))
      const root = nbtSchema.parse(parsedData.parsed.value)
      const blocks = root.palette.value.value
      blocks.forEach((block, index) => {
        const id = block.Name.value
        if (map.has(id)) {
          map.get(id)!.push(index)
        } else {
          map.set(id, [index])
        }
        replaceMap[id] = ''
      })
      uploaded = true
    } catch (e) {
      console.error(e)
      alert('This does not look like a Create schematic file 🤕')
    }
  }

  const saveFile = () => {
    if (!parsedData) return
    ;(parsedData.parsed.value as NbtSchema).palette.value.value.forEach((block) => {
      const id = block.Name.value
      if (replaceMap[id] && replaceMap[id] !== '') {
        block.Name.value = replaceMap[id]
      }
    })
    const buffer = nbt.writeUncompressed(parsedData.parsed)
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    saveAs(blob, path.basename(name, '.nbt') + '_modified.nbt')
  }
</script>

<div class="flex min-h-screen w-full justify-center">
  <main
    class="flex w-[1200px] max-w-full flex-col items-center justify-center gap-6 p-6 text-center"
  >
    <h1 class="text-4xl font-bold">Minecraft Create mod schematic editor</h1>
    {#if uploaded}
      <button
        onclick={() => {
          uploaded = false
          map = new Map()
          replaceMap = {}
          parsedData = null
          name = ''
        }}
        class="cursor-pointer rounded-full border border-amber-500 bg-amber-400 px-4 py-1 font-medium"
      >
        Upload another file
      </button>
      <div class="flex w-[600px] max-w-full flex-col gap-3 border border-neutral-400 p-4 text-left">
        {#if map.size > 0}
          {#each map.keys() as blockId (blockId)}
            <div class="flex w-full items-center gap-2">
              <span class="min-w-0 flex-1 break-words">{blockId}</span>
              <span>&rarr;</span>
              <input
                type="text"
                bind:value={replaceMap[blockId]}
                class="flex-1 border-b border-b-neutral-200"
              />
            </div>
          {/each}
        {:else}
          <span>No blocks found in this schematic</span>
        {/if}
      </div>
      <button
        onclick={saveFile}
        class="cursor-pointer rounded-full border border-amber-500 bg-amber-400 px-4 py-1 font-medium"
      >
        Save .nbt file
      </button>
    {:else}
      <h2 class="text-2xl font-semibold">
        Replace blocks in your Create's schematicannon .nbt file online
      </h2>
      <p class="w-[600px] max-w-full">
        Have you ever had schematic with just one or two blocks that need to be replaced? Worry no
        more, as this tool is the easiest way to replace blocks in your file without having to load
        it in creative world and resaving
      </p>
      <Dropzone
        disableDefaultStyles
        containerClasses="flex w-[600px] max-w-full cursor-pointer flex-col rounded-lg border-2 border-dashed border-neutral-400 py-8"
        containerStyles="border-color: {dragOver ? 'blue' : 'border-neutral-400'}"
        accept=".nbt"
        on:drop={(e) => {
          dragOver = false
          const file = e.detail.acceptedFiles?.[0]
          if (file && file instanceof File) {
            name = file.name
            if (file.name.endsWith('.nbt')) {
              const reader = new FileReader()
              reader.onload = (event) => {
                const data = event.target?.result
                if (data) {
                  if (data instanceof ArrayBuffer) {
                    parse(data)
                  }
                }
              }
              reader.readAsArrayBuffer(file)
            }
          }
        }}
        on:dragenter={() => (dragOver = true)}
        on:droprejected={() => {
          dragOver = false
          alert('Only .nbt files are accepted')
        }}
        on:dragleave={() => (dragOver = false)}
      >
        <span>drop your .nbt schematic here</span>
        <span>or click to upload it</span>
      </Dropzone>
    {/if}
    <a href="https://hloth.dev" class="text-neutral-500 underline">by hloth.dev</a>
  </main>
</div>
