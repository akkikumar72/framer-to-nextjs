#!/usr/bin/env ruby
# Dependency-free static validation. Uses system Ruby's safe YAML loader only.
require 'yaml'
require 'pathname'

def check(condition, message)
  abort "Validation failed: #{message}" unless condition
end

root = ARGV[0] ? File.expand_path(ARGV[0]) : File.expand_path('../skills/framer-to-nextjs', __dir__)
skill = File.join(root, 'SKILL.md')
check(File.file?(skill), "missing #{skill}")
content = File.read(skill, encoding: 'UTF-8')
front = content.match(/\A---\r?\n(.*?)\r?\n---(?:\r?\n|\z)/m)
check(front, 'missing YAML frontmatter')
begin
  data = YAML.safe_load(front[1], permitted_classes: [], permitted_symbols: [], aliases: false)
  check(data.is_a?(Hash), 'frontmatter must be a mapping')
  check((data.keys - %w[name description license metadata allowed-tools]).empty?, 'unknown frontmatter key')
  name = data['name']
  check(name.is_a?(String) && name.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/) && name.length <= 64, 'invalid skill name')
  check(File.basename(root) == name, 'folder name differs from skill name')
  desc = data['description']
  check(desc.is_a?(String) && !desc.strip.empty? && desc.length <= 1024 && !desc.match?(/[<>]/), 'invalid description')
  meta = YAML.safe_load(File.read(File.join(root, 'agents', 'openai.yaml')), permitted_classes: [], permitted_symbols: [], aliases: false)
  check(meta.is_a?(Hash) && meta['interface'].is_a?(Hash), 'missing interface metadata')
  short = meta['interface']['short_description']
  check(short.is_a?(String) && short.length.between?(25, 64), 'short description must be 25-64 characters')
  prompt = meta['interface']['default_prompt']
  check(prompt.is_a?(String) && prompt.include?("$#{name}"), 'default prompt must invoke skill')
rescue Psych::Exception => e
  abort "Validation failed: invalid YAML: #{e.message}"
end

files = Dir.glob(File.join(root, '**', '*')).select { |path| File.file?(path) }
files.select { |path| File.extname(path) == '.md' }.each do |path|
  text = File.read(path, encoding: 'UTF-8')
  check(!text.include?('/Users/'), "private absolute path in #{path}")
  check(!text.match?(/\b(?:TODO|TBD|PLACEHOLDER)\b/), "unfinished scaffold in #{path}")
  text.scan(/\[[^\]]*\]\(([^)]+)\)/).flatten.each do |target|
    next if target.match?(/\A(?:https?:|#|mailto:)/)
    target = target.split('#', 2).first
    resolved = File.expand_path(target, File.dirname(path))
    check(resolved.start_with?(root + File::SEPARATOR), "reference escapes skill: #{target}")
    check(File.file?(resolved), "missing reference #{target} in #{path}")
  end
end
puts "Static skill validation passed (#{files.length} files; YAML, metadata, local references)."
