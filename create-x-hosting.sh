tmp=$(mktemp --directory)

tag=0.0.1

echo "Processing tag ${tag} in ${tmp}"

git clone --quiet --depth 1 --no-checkout https://github.com/baseless-dev/baseless $tmp
git --work-tree $tmp --git-dir $tmp/.git checkout --quiet tags/$tag

modules=()

for path in $(find $tmp -mindepth 1 -maxdepth 1 -type d -not -name ".*")
do
	# Copy content to tmp folder $dirname@$tag
	dirname=$(basename $path)
	dest="pages/x/$dirname@$tag"
	modules+=($dest)
	
	echo "Processing ${dirname}@${tag}"

	mkdir -p $dest
	cp -r $path/* $dest
	find $dest -type f -name "*.ts" -exec sed -i -r 's/https:\/\/baseless.dev\/x\/([^\/]*)\//https:\/\/baseless.dev\/x\/\1@'$tag'\//g' {} +
done

echo "Done"